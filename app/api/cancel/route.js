import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import supabaseAdmin from '@/lib/server/supabase-admin'
import { writeLog } from '@/lib/server/log-service'
import { sendCancellationEmail } from '@/lib/server/email-service'



const VALID_REASONS = [
  'müşteri gelmedi',
  'araç sorunlu',
  'yanlış rezervasyon',
  'kullanıcı talebi'
]

export async function POST(request) {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          }
        }
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Giriş yapmanız gerekiyor' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { bookingId, reason } = body

    if (!bookingId || !reason) {
      return NextResponse.json(
        { error: 'bookingId ve reason zorunludur' },
        { status: 400 }
      )
    }

    // Kullanıcı rolünü kontrol et
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const isStaffOrAdmin = ['staff', 'admin'].includes(userData?.role)

    // Staff/admin için reason zorunlu ve listede olmalı
    if (isStaffOrAdmin && !VALID_REASONS.includes(reason)) {
      return NextResponse.json(
        { error: 'Geçersiz iptal sebebi', validReasons: VALID_REASONS },
        { status: 400 }
      )
    }

    // Booking'i getir
    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (!booking) {
      return NextResponse.json(
        { error: 'Rezervasyon bulunamadı' },
        { status: 404 }
      )
    }

    // Kullanıcı sadece kendi booking'ini iptal edebilir
    if (!isStaffOrAdmin && booking.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Bu işlem için yetkiniz yok' },
        { status: 403 }
      )
    }

    // Zaten iptal edilmiş mi
    if (booking.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Rezervasyon zaten iptal edilmiş' },
        { status: 409 }
      )
    }

    // İptal süresi kontrolü (settings'den)
    const { data: limitSetting } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', 'cancel_limit_hours')
      .single()

    const limitHours = parseInt(limitSetting?.value ?? 2)
    const slotDate = new Date(booking.slot_time)
    const now = new Date()
    const hoursDiff = (slotDate - now) / (1000 * 60 * 60)

    if (!isStaffOrAdmin && hoursDiff < limitHours) {
      return NextResponse.json(
        { error: `Randevudan ${limitHours} saat önce iptal edilebilir` },
        { status: 400 }
      )
    }

    // Status güncelle — trigger otomatik plaka bloklar ve slot sayacını düşürür
    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({ status: 'CANCELLED' })
      .eq('id', bookingId)

    if (updateError) {
      return NextResponse.json(
        { error: 'İptal işlemi başarısız' },
        { status: 500 }
      )
    }

    // Log yaz
    await writeLog({
      type: 'booking_cancelled',
      actorId: user.id,
      targetId: bookingId,
      reason,
      metadata: {
        plate: booking.plate,
        slotTime: booking.slot_time,
        cancelledBy: userData.role
      }
    })

    return NextResponse.json({ success: true, message: 'Rezervasyon iptal edildi' })

  } catch (error) {
    console.error('İptal hatası:', error)
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}



const { data: userEmail } = await supabaseAdmin
  .from('users')
  .select('email, name')
  .eq('id', booking.user_id)
  .single()

if (userEmail) {
  await sendCancellationEmail({
    to: userEmail.email,
    name: userEmail.name,
    plate: booking.plate,
    slotTime: booking.slot_time,
    reason
  })
}