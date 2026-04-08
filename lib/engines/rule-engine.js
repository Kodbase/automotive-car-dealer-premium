import supabaseAdmin from '@/lib/server/supabase-admin'

export async function validateBookingRequest({
  userId,
  plate,
  slotTime
}) {
  const errors = []

  // 1. Kullanıcı var mı ve email verified mı
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, is_verified, role')
    .eq('id', userId)
    .single()

  if (userError) {
    return { valid: false, reason: 'USER_NOT_FOUND' }
  }

  // 2. Aktif booking var mı
  const { data: activeBooking } = await supabaseAdmin
    .from('bookings')
    .select('id')
    .eq('plate', plate.toUpperCase())
    .in('status', ['WAITING', 'ACCEPTED', 'IN_PROGRESS'])
    .single()
  
  if (activeBooking) {
    return { valid: false, reason: 'ACTIVE_BOOKING_EXISTS' }
  }


  // 3. Plaka bloklu mu
  const { data: blockedPlate } = await supabaseAdmin
    .from('blocked_plates')
    .select('blocked_until')
    .eq('plate', plate.toUpperCase())
    .gt('blocked_until', new Date().toISOString())
    .single()

  if (blockedPlate) {
    return {
      valid: false,
      reason: 'PLATE_BLOCKED',
      blockedUntil: blockedPlate.blocked_until
    }
  }

  // 4. Slot zamanı geçmiş mi
  if (new Date(slotTime) <= new Date()) {
    return { valid: false, reason: 'SLOT_TIME_PASSED' }
  }

  return { valid: true, user }
}