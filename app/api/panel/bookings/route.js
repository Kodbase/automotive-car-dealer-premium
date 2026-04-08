import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/server/supabase-server'
import supabaseAdmin from '@/lib/server/supabase-admin'

export async function GET(request) {
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

    const { searchParams } = new URL(request.url)
    const page   = parseInt(searchParams.get('page')  || '1')
    const limit  = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const date   = searchParams.get('date')
    const search = searchParams.get('search')
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('bookings')
      .select(`
        id,
        plate,
        slot_time,
        status,
        created_at,
        user:users!bookings_user_id_fkey (id, name, email, phone),
        package:packages!bookings_package_id_fkey (id, name, price),
        location:locations!bookings_location_id_fkey (id, name)
      `, { count: 'exact' })
      .order('slot_time', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) query = query.eq('status', status)

    if (date) {
      const dayStart = new Date(date + 'T00:00:00.000Z')
      const dayEnd   = new Date(date + 'T23:59:59.999Z')
      query = query
        .gte('slot_time', dayStart.toISOString())
        .lte('slot_time', dayEnd.toISOString())
    }

    if (search) {
      query = query.ilike('plate', `%${search}%`)
    }

    const { data: bookings, count, error } = await query

    if (error) {
      console.error('Bookings query error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      bookings,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (err) {
    console.error('Panel bookings error:', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}