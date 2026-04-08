import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/server/supabase-server'
import supabaseAdmin from '@/lib/server/supabase-admin'
import { writeLog } from '@/lib/server/log-service'

// Tüm lokasyonları getir
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('locations')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ locations: data })
  } catch (error) {
    return NextResponse.json(
      { error: 'Lokasyonlar alınamadı' },
      { status: 500 }
    )
  }
}

// Yeni lokasyon oluştur
export async function POST(request) {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Giriş yapmanız gerekiyor' }, { status: 401 })
    }

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Yetersiz yetki' }, { status: 403 })
    }

    const body = await request.json()
    const { name, address, is_active = true } = body

    if (!name || !address) {
      return NextResponse.json(
        { error: 'name ve address zorunludur' },
        { status: 400 }
      )
    }

    const { data: newLocation, error: insertError } = await supabaseAdmin
      .from('locations')
      .insert({ name, address, is_active })
      .select()
      .single()

    if (insertError) throw insertError

    try {
      await writeLog({
        type: 'admin_action',
        actorId: user.id,
        targetId: newLocation.id,
        reason: 'location_created',
        metadata: { name, address }
      })
    } catch (e) { console.error('Log yazılamadı:', e) }

    return NextResponse.json({ success: true, location: newLocation }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Lokasyon oluşturulamadı' }, { status: 500 })
  }
}

// Lokasyon güncelle
export async function PATCH(request) {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Giriş yapmanız gerekiyor' }, { status: 401 })
    }

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Yetersiz yetki' }, { status: 403 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'id zorunludur' }, { status: 400 })
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('locations')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    try {
      await writeLog({
        type: 'admin_action',
        actorId: user.id,
        targetId: id,
        reason: 'location_updated',
        metadata: updates
      })
    } catch (e) { console.error('Log yazılamadı:', e) }

    return NextResponse.json({ success: true, location: updated })
  } catch (error) {
    return NextResponse.json({ error: 'Lokasyon güncellenemedi' }, { status: 500 })
  }
}