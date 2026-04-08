import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/server/supabase-server'
import supabaseAdmin from '@/lib/server/supabase-admin'

async function getAuthUser(supabase) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data } = await supabaseAdmin
    .from('users')
    .select('id, role')
    .eq('id', session.user.id)
    .single()

  return data
}

export async function GET(request) {
  try {
    const supabase = await createSupabaseServer()
    const actor = await getAuthUser(supabase)

    if (!actor || actor.role !== 'admin') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const role = searchParams.get('role')
    const search = searchParams.get('search')
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('users')
      .select('id, name, email, phone, role, is_verified, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (role) query = query.eq('role', role)
    if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)

    const { data: users, count, error } = await query

    if (error) throw error

    return NextResponse.json({
      users,
      pagination: { page, limit, total: count, pages: Math.ceil(count / limit) }
    })
  } catch (err) {
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}