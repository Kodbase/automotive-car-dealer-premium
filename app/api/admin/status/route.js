// app/api/admin/status/route.js

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import supabaseAdmin from '@/lib/server/supabase-admin'
import { writeLog } from '@/lib/server/log-service'
import {
  sendStatusUpdateEmail,
  sendCancellationEmail,
} from '@/lib/server/email-service'

const VALID_STATUSES = ['WAITING', 'ACCEPTED', 'IN_PROGRESS', 'DONE', 'CANCELLED']

const VALID_REASONS = [
  'müşteri gelmedi',
  'araç sorunlu',
  'yanlış rezervasyon',
]

const ALLOWED_TRANSITIONS = {
  WAITING:     ['IN_PROGRESS', 'CANCELLED'],
  ACCEPTED:    ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['DONE', 'CANCELLED'],
  DONE:        [],
  CANCELLED:   [],
}

export async function POST(request) {
  try {
    // 1. Auth
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Giriş yapmanız gerekiyor' }, { status: 401 })
    }

    // 2. Rol kontrolü
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role, name')
      .eq('id', user.id)
      .single()

    if (!['staff', 'admin'].includes(userData?.role)) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 })
    }

    // 3. Body — sadece bir kez parse
    const body = await request.json()
    const { bookingId, status, reason } = body

    if (!bookingId || !status) {
      return NextResponse.json({ error: 'bookingId ve status zorunludur' }, { status: 400 })
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Geçersiz status' }, { status: 400 })
    }

    if (status === 'CANCELLED' && !VALID_REASONS.includes(reason)) {
      return NextResponse.json(
        { error: 'İptal için geçerli bir sebep zorunludur' },
        { status: 400 }
      )
    }

    // 4. Booking getir — user join ile email + phone dahil
    const { data: booking, error: bookingErr } = await supabaseAdmin
      .from('bookings')
      .select(`
        id,
        plate,
        status,
        slot_time,
        email,
        user:users (
          id,
          name,
          email,
          phone
        ),
        package:packages ( name ),
        location:locations ( name )
      `)
      .eq('id', bookingId)
      .single()

    if (bookingErr || !booking) {
      return NextResponse.json({ error: 'Rezervasyon bulunamadı' }, { status: 404 })
    }

    // 5. Geçiş kontrolü
    if (booking.status === 'CANCELLED' || booking.status === 'DONE') {
      return NextResponse.json({ error: 'Bu rezervasyon güncellenemez' }, { status: 409 })
    }

    const allowed = ALLOWED_TRANSITIONS[booking.status] || []
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { error: `${booking.status} → ${status} geçişi izin verilmiyor` },
        { status: 422 }
      )
    }

    // 6. Status güncelle
    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({ status })
      .eq('id', bookingId)

    if (updateError) {
      console.error('Status güncelleme hatası:', updateError)
      return NextResponse.json({ error: 'Güncelleme başarısız' }, { status: 500 })
    }

    // 7. Email gönder — booking.email öncelikli, yoksa user.email
    const recipientEmail = booking.email || booking.user?.email || null
    const recipientName  = booking.user?.name || 'Değerli Müşteri'

    if (recipientEmail) {
      try {
        if (status === 'CANCELLED') {
          await sendCancellationEmail({
            to:       recipientEmail,
            name:     recipientName,
            plate:    booking.plate,
            slotTime: booking.slot_time,
            reason:   reason || null,
          })
        } else {
          // IN_PROGRESS veya DONE
          await sendStatusUpdateEmail({
            to:        recipientEmail,
            name:      recipientName,
            plate:     booking.plate,
            newStatus: status,
            slotTime:  booking.slot_time,
          })
        }
      } catch (emailErr) {
        // Email hatası ana akışı durdurmamalı
        console.error('Email gönderilemedi:', emailErr)
      }
    } else {
      console.warn(`Booking ${bookingId} için email adresi bulunamadı — mail gönderilmedi`)
    }

    // 8. Log yaz
    try {
      await writeLog({
        type:     status === 'CANCELLED' ? 'booking_cancelled' : 'status_changed',
        actorId:  user.id,
        targetId: bookingId,
        reason:   reason ?? null,
        metadata: {
          oldStatus:  booking.status,
          newStatus:  status,
          plate:      booking.plate,
          updatedBy:  userData.role,
          actorName:  userData.name,
        },
      })
    } catch (logErr) {
      console.error('Log yazılamadı:', logErr)
    }

    return NextResponse.json({
      success:   true,
      bookingId,
      oldStatus: booking.status,
      newStatus: status,
    })
  } catch (error) {
    console.error('Status güncelleme hatası:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}