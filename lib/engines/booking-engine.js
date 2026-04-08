import supabaseAdmin from '@/lib/server/supabase-admin'
import { validateBookingRequest } from './rule-engine'
import { findAlternativeSlots } from './slot-engine'
import { writeLog } from '@/lib/server/log-service'
import { sendBookingConfirmation } from '@/lib/server/email-service'

// Email ile kullanıcı bul veya oluştur
async function findOrCreateUser({ email, name, phone }) {
  const normalizedEmail = email.toLowerCase().trim()

  // Önce mevcut kullanıcıyı ara
  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('id, name, email')
    .eq('email', normalizedEmail)
    .single()

  if (existing) return existing

  // Yoksa oluştur — Supabase Auth olmadan direkt users tablosuna
  const { data: newUser, error } = await supabaseAdmin
    .from('users')
    .insert({
      email: normalizedEmail,
      name: name.trim(),
      phone: phone.trim(),
      role: 'user',
      is_verified: false
    })
    .select('id, name, email')
    .single()

  if (error) throw new Error('Kullanıcı oluşturulamadı: ' + error.message)
  return newUser
}

export async function processBooking({
  plate,
  packageId,
  locationId,
  slotTime,
  email,
  name,
  phone
}) {
  // 1. Kullanıcıyı bul veya oluştur
  const user = await findOrCreateUser({ email, name, phone })

  // 2. Kural kontrolü — artık userId ile
  const validation = await validateBookingRequest({ 
    userId: user.id, 
    plate, 
    slotTime 
  })

  if (!validation.valid) {
    if (validation.reason === 'PLATE_BLOCKED') {
      return { success: false, reason: validation.reason, blockedUntil: validation.blockedUntil }
    }
    return { success: false, reason: validation.reason }
  }

  // 3. Paket kontrolü
  const { data: pkg } = await supabaseAdmin
    .from('packages')
    .select('id, name')
    .eq('id', packageId)
    .eq('is_active', true)
    .single()

  if (!pkg) return { success: false, reason: 'PACKAGE_NOT_FOUND' }

  // 4. Lokasyon kontrolü
  const { data: location } = await supabaseAdmin
    .from('locations')
    .select('id, name')
    .eq('id', locationId)
    .eq('is_active', true)
    .single()

  if (!location) return { success: false, reason: 'LOCATION_NOT_FOUND' }

  // 5. Slot yoksa oluştur
  const { data: existingSlot } = await supabaseAdmin
    .from('slots')
    .select('id')
    .eq('slot_time', slotTime)
    .single()

  if (!existingSlot) {
    const { data: settings } = await supabaseAdmin
      .from('settings')
      .select('key, value')
      .eq('key', 'capacity_default')
      .single()

    const capacity = settings?.value || 3

    await supabaseAdmin
      .from('slots')
      .insert({
        slot_time: slotTime,
        capacity: Number(capacity),
        reserved_count: 0
      })
  }

  // 6. Booking oluştur
  const { data: bookingId, error: bookingError } = await supabaseAdmin
    .rpc('book_slot', {
      p_user_id:     user.id,
      p_plate:       plate.toUpperCase(),
      p_package_id:  packageId,
      p_location_id: locationId,
      p_slot_time:   slotTime
    })

  if (bookingError) {
    if (bookingError.message.includes('SLOT_FULL')) {
      const alternatives = await findAlternativeSlots(slotTime)
      return { success: false, reason: 'SLOT_FULL', alternativeSlots: alternatives }
    }
    return { success: false, reason: 'BOOKING_FAILED', detail: bookingError.message }
  }

  // 7. Email kolonunu güncelle
  await supabaseAdmin
    .from('bookings')
    .update({ email: email.toLowerCase().trim() })
    .eq('id', bookingId)

  // 8. Log
  try {
    await writeLog({
      type: 'booking_created',
      actorId: user.id,
      targetId: bookingId,
      metadata: {
        plate: plate.toUpperCase(),
        packageName: pkg.name,
        locationName: location.name,
        slotTime
      }
    })
  } catch {}

  // 9. Onay maili
  try {
    await sendBookingConfirmation({
      to: email.toLowerCase().trim(),
      name: user.name,
      plate: plate.toUpperCase(),
      packageName: pkg.name,
      locationName: location.name,
      slotTime,
      bookingId
    })
  } catch {}

  return {
    success: true,
    bookingId,
    package: pkg,
    location,
    slotTime,
    plate: plate.toUpperCase()
  }
}