import supabaseAdmin from '@/lib/server/supabase-admin'
import { addMinutes, format, parseISO, isAfter, isBefore } from 'date-fns'

// Ayarları Supabase'den çek
async function getSettings() {
  const { data, error } = await supabaseAdmin
    .from('settings')
    .select('key, value')

  if (error) throw new Error('Ayarlar alınamadı')

  return data.reduce((acc, row) => {
    acc[row.key] = row.value
    return acc
  }, {})
}

// Belirli bir gün için tüm slotları oluştur
export async function generateDailySlots(dateStr) {
  const settings = await getSettings()

  const workingHours = settings['working_hours']
  const slotDuration = parseInt(settings['slot_duration'])
  const capacityDefault = parseInt(settings['capacity_default'])

  const [startHour, startMin] = workingHours.start.split(':').map(Number)
  const [endHour, endMin] = workingHours.end.split(':').map(Number)

  const baseDate = new Date(dateStr + 'T00:00:00+03:00')
  const startTime = new Date(baseDate)
  startTime.setHours(startHour, startMin, 0, 0)

  const endTime = new Date(baseDate)
  endTime.setHours(endHour, endMin, 0, 0)

  const slots = []
  let current = startTime

  while (isBefore(current, endTime)) {
    slots.push({
      slot_time: current.toISOString(),
      capacity: capacityDefault,
      reserved_count: 0
    })
    current = addMinutes(current, slotDuration)
  }

  // Mevcut slotları kontrol et, olmayanları ekle
  const { data: existing } = await supabaseAdmin
    .from('slots')
    .select('slot_time')
    .gte('slot_time', startTime.toISOString())
    .lte('slot_time', endTime.toISOString())

  const existingTimes = new Set(existing?.map(s => s.slot_time) ?? [])
  const newSlots = slots.filter(s => !existingTimes.has(s.slot_time))

  if (newSlots.length === 0) return { created: 0, message: 'Slotlar zaten mevcut' }

  const { error } = await supabaseAdmin.from('slots').insert(newSlots)
  if (error) throw new Error('Slot oluşturulamadı: ' + error.message)

  return { created: newSlots.length, message: `${newSlots.length} slot oluşturuldu` }
}

// Müsait slotları getir
export async function getAvailableSlots(dateStr, locationId) {
  const startOfDay = `${dateStr}T00:00:00+03:00`
  const endOfDay   = `${dateStr}T23:59:59+03:00`
  const now        = new Date()

  const settings     = await getSettings()
  const workingHours = settings['working_hours']
  const workingDays  = settings['working_days'] || [1, 2, 3, 4, 5]
  const slotDuration = parseInt(settings['slot_duration']) || 30
  const capacity     = parseInt(settings['capacity_default']) || 3

  const dayOfWeek   = new Date(dateStr + 'T12:00:00+03:00').getDay()
  const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek
  if (!workingDays.includes(adjustedDay)) return []

  // DB'deki slotları location bazlı çek
  let query = supabaseAdmin
    .from('slots')
    .select('*')
    .gte('slot_time', startOfDay)
    .lte('slot_time', endOfDay)
    .order('slot_time', { ascending: true })

  if (locationId) {
    query = query.eq('location_id', locationId)
  }

  const { data: dbSlots, error } = await query
  if (error) throw new Error('Slotlar alınamadı')

  const dbSlotMap = new Map(
    (dbSlots || []).map(s => [new Date(s.slot_time).toISOString(), s])
  )

  const startTime = new Date(`${dateStr}T${workingHours.start}:00+03:00`)
  const endTime   = new Date(`${dateStr}T${workingHours.end}:00+03:00`)

  const allSlots = []
  let current = new Date(startTime)

  while (isBefore(current, endTime)) {
    const isoTime = current.toISOString()

    if (isAfter(current, now)) {
      if (dbSlotMap.has(isoTime)) {
        const dbSlot = dbSlotMap.get(isoTime)
        allSlots.push({
          ...dbSlot,
          is_available: dbSlot.reserved_count < dbSlot.capacity,
          remaining:    dbSlot.capacity - dbSlot.reserved_count,
          is_dynamic:   false,
        })
      } else {
        allSlots.push({
          id:             `dynamic_${isoTime}`,
          slot_time:      isoTime,
          capacity,
          reserved_count: 0,
          is_available:   true,
          remaining:      capacity,
          is_dynamic:     true,
          location_id:    locationId,
        })
      }
    }

    current = addMinutes(current, slotDuration)
  }

  return allSlots
}

// Alternatif slot bul (slot dolu olduğunda)
export async function findAlternativeSlots(slotTime, count = 3) {
  const settings = await getSettings()
  const slotDuration = parseInt(settings['slot_duration'])

  const base = new Date(slotTime)
  const alternatives = []

  for (let i = 1; i <= 10 && alternatives.length < count; i++) {
    const candidateTime = addMinutes(base, slotDuration * i)

    const { data } = await supabaseAdmin
      .from('slots')
      .select('*')
      .eq('slot_time', candidateTime.toISOString())
      .single()

    if (data && data.reserved_count < data.capacity) {
      alternatives.push({
        ...data,
        remaining: data.capacity - data.reserved_count
      })
    }
  }

  return alternatives
}