// app/api/booking/reschedule/route.js

import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/server/supabase-admin'
import { writeLog } from '@/lib/server/log-service'

// Session token doğrulama (48 saat)
async function verifySessionToken(email, token) {
  if (!token) return false
  const { data, error } = await supabaseAdmin
    .from('tracking_sessions')
    .select('id, expires_at')
    .eq('email', email)
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .limit(1)
    .single()

  if (error || !data) return false
  return true
}

// OTP kodu doğrulama — fallback (eski akış için)
async function verifyOtp(email, code) {
  if (!code) return false
  const { data, error } = await supabaseAdmin
    .from('verification_codes')
    .select('id, expires_at')
    .eq('email', email)
    .eq('code', code)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return false
  if (new Date(data.expires_at) < new Date()) return false
  return true
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { bookingId, newSlotTime, email, sessionToken, otpCode } = body

    if (!bookingId || !newSlotTime || !email) {
      return NextResponse.json({ error: 'Zorunlu alanlar eksik' }, { status: 400 })
    }

    if (!sessionToken && !otpCode) {
      return NextResponse.json(
        { error: 'Kimlik doğrulama gerekli' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Önce session token dene, sonra OTP
    let authenticated = await verifySessionToken(normalizedEmail, sessionToken)
    if (!authenticated) {
      authenticated = await verifyOtp(normalizedEmail, otpCode)
    }

    if (!authenticated) {
      return NextResponse.json(
        { error: 'Geçersiz veya süresi dolmuş oturum' },
        { status: 401 }
      )
    }

    // Booking'i çek
    const { data: booking, error: bookingErr } = await supabaseAdmin
      .from('bookings')
      .select('id, email, plate, slot_time, status, reschedule_count')
      .eq('id', bookingId)
      .single()

    if (bookingErr || !booking) {
      return NextResponse.json({ error: 'Rezervasyon bulunamadı' }, { status: 404 })
    }

    // Email eşleşme kontrolü
    if (booking.email?.toLowerCase() !== normalizedEmail) {
      return NextResponse.json(
        { error: 'Bu rezervasyon size ait değil' },
        { status: 403 }
      )
    }

    // Aktif mi?
    if (!['ACCEPTED', 'IN_PROGRESS'].includes(booking.status)) {
      return NextResponse.json(
        { error: 'Bu rezervasyon aktif değil' },
        { status: 400 }
      )
    }

    // cancel_limit_hours kontrolü
    const { data: settingsRows } = await supabaseAdmin
      .from('settings')
      .select('key, value')
      .eq('key', 'cancel_limit_hours')

    const cancelLimitHours = Number(settingsRows?.[0]?.value ?? 2)
    const slotTime  = new Date(booking.slot_time)
    const diffHours = (slotTime - new Date()) / (1000 * 60 * 60)

    if (diffHours < cancelLimitHours) {
      return NextResponse.json(
        { error: `Randevuya ${cancelLimitHours} saatten az kaldığı için değişiklik yapılamaz` },
        { status: 400 }
      )
    }

    // Yeni slot geçmişte mi?
    if (new Date(newSlotTime) <= new Date()) {
      return NextResponse.json({ error: 'Geçmiş bir saate taşınamaz' }, { status: 400 })
    }

    // Yeni slot müsait mi?
    const { data: newSlot } = await supabaseAdmin
      .from('slots')
      .select('id, capacity, reserved_count')
      .eq('slot_time', newSlotTime)
      .single()

    if (newSlot && newSlot.reserved_count >= newSlot.capacity) {
      return NextResponse.json({ error: 'Seçilen slot dolu' }, { status: 400 })
    }

    // Yeni slot DB'de yoksa oluştur
    if (!newSlot) {
      const { data: settingsAll } = await supabaseAdmin
        .from('settings')
        .select('key, value')
        .eq('key', 'capacity_default')

      const capacityDefault = Number(settingsAll?.[0]?.value ?? 3)

      await supabaseAdmin.from('slots').insert({
        slot_time:      newSlotTime,
        capacity:       capacityDefault,
        reserved_count: 0,
      })
    }

    // Booking güncelle — trigger slot sayaçlarını otomatik günceller
    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('bookings')
      .update({ slot_time: newSlotTime })
      .eq('id', bookingId)
      .select()
      .single()

    if (updateErr) throw updateErr

    // Log — plaka bloğu YOK
    try {
      await writeLog({
        type:     'booking_rescheduled',
        actorId:  null,
        targetId: bookingId,
        reason:   'Kullanıcı tarafından yeniden planlandı',
        metadata: {
          plate:       booking.plate,
          oldSlotTime: booking.slot_time,
          newSlotTime,
        },
      })
    } catch (logErr) {
      console.error('Log yazılamadı:', logErr)
    }

    return NextResponse.json({ success: true, booking: updated })
  } catch (err) {
    console.error('POST /api/booking/reschedule error:', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}