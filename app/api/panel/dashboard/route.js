import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/server/supabase-server'
import supabaseAdmin from '@/lib/server/supabase-admin'

export async function GET() {
  try {
    const supabase = await createSupabaseServer()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const { data: actor } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('id', session.user.id)
      .single()

    if (!actor || !['staff', 'admin'].includes(actor.role)) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowISO = tomorrow.toISOString()

    const weekStart = new Date(today)
    weekStart.setDate(weekStart.getDate() - 7)
    const weekStartISO = weekStart.toISOString()

    const [
      { data: todayBookings },
      { data: weekBookings },
      { data: slots },
      { data: recentLogs }
    ] = await Promise.all([
      // Bugünkü bookinglar — status dağılımı için
      supabaseAdmin
        .from('bookings')
        .select('id, status')
        .gte('slot_time', todayISO)
        .lt('slot_time', tomorrowISO),

      // Bu haftaki tamamlanan bookinglar — gelir hesabı için
      supabaseAdmin
        .from('bookings')
        .select('id, status, package_id, packages(price)')
        .gte('created_at', weekStartISO)
        .in('status', ['DONE', 'WAITING', 'ACCEPTED', 'IN_PROGRESS', 'CANCELLED']),

      // Bugünkü slotlar — doluluk oranı için
      supabaseAdmin
        .from('slots')
        .select('id, capacity, reserved_count')
        .gte('slot_time', todayISO)
        .lt('slot_time', tomorrowISO),

      // Son 10 log
      supabaseAdmin
        .from('logs')
        .select('id, type, reason, metadata, created_at, users!actor_id(id, name, role)')
        .order('created_at', { ascending: false })
        .limit(10)
    ])

    // Bugünkü status dağılımı
    const statusCounts = { WAITING: 0, ACCEPTED: 0, IN_PROGRESS: 0, DONE: 0, CANCELLED: 0 }
    ;(todayBookings || []).forEach(b => {
      if (statusCounts[b.status] !== undefined) statusCounts[b.status]++
    })

    // Bugünkü doluluk oranı
    const totalCapacity = (slots || []).reduce((s, sl) => s + sl.capacity, 0)
    const totalReserved = (slots || []).reduce((s, sl) => s + sl.reserved_count, 0)
    const occupancyRate = totalCapacity > 0
      ? Math.round((totalReserved / totalCapacity) * 100)
      : 0

    // Bu hafta gelir (sadece DONE olanlar)
    const weekRevenue = (weekBookings || [])
      .filter(b => b.status === 'DONE')
      .reduce((sum, b) => sum + (b.packages?.price || 0), 0)

    // Bu hafta toplam (iptal hariç)
    const weekTotal = (weekBookings || []).filter(b => b.status !== 'CANCELLED').length

    return NextResponse.json({
      today: {
        total: (todayBookings || []).length,
        statusCounts
      },
      occupancy: {
        rate: occupancyRate,
        reserved: totalReserved,
        capacity: totalCapacity
      },
      week: {
        total: weekTotal,
        revenue: weekRevenue
      },
      recentLogs: recentLogs || []
    })
  } catch (err) {
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}