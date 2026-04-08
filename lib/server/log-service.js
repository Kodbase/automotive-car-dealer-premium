import supabaseAdmin from '@/lib/server/supabase-admin'

// Log yaz (immutable)
export async function writeLog({
  type,
  actorId,
  targetId = null,
  reason = null,
  metadata = {}
}) {
  const { error } = await supabaseAdmin
    .from('logs')
    .insert({
      type,
      actor_id: actorId,
      target_id: targetId,
      reason,
      metadata
    })

  if (error) {
    console.error('Log yazılamadı:', error.message)
  }
}

// Tüm logları getir (admin)
export async function getLogs({
  type = null,
  actorId = null,
  targetId = null,
  limit = 50,
  offset = 0
} = {}) {
  let query = supabaseAdmin
    .from('logs')
    .select(`
      id,
      type,
      actor_id,
      target_id,
      reason,
      metadata,
      created_at,
      users!actor_id (id, name, email, role)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (type) query = query.eq('type', type)
  if (actorId) query = query.eq('actor_id', actorId)
  if (targetId) query = query.eq('target_id', targetId)

  const { data, error } = await query

  if (error) throw new Error('Loglar alınamadı: ' + error.message)

  return data
}

// Belirli bir booking'in log geçmişi
export async function getBookingLogs(bookingId) {
  const { data, error } = await supabaseAdmin
    .from('logs')
    .select(`
      id,
      type,
      reason,
      metadata,
      created_at,
      users!actor_id (id, name, role)
    `)
    .eq('target_id', bookingId)
    .order('created_at', { ascending: true })

  if (error) throw new Error('Booking logları alınamadı')

  return data
}

// Log istatistikleri (admin dashboard için)
export async function getLogStats() {
  const { data, error } = await supabaseAdmin
    .from('logs')
    .select('type, created_at')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  if (error) throw new Error('İstatistikler alınamadı')

  const stats = data.reduce((acc, log) => {
    acc[log.type] = (acc[log.type] || 0) + 1
    return acc
  }, {})

  return stats
}