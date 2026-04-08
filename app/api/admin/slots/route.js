import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/server/supabase-server'
import supabaseAdmin from '@/lib/server/supabase-admin'
import { writeLog } from '@/lib/server/log-service'

async function getAdminUser(supabase) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  const { data } = await supabaseAdmin
    .from('users')
    .select('id, role')
    .eq('id', session.user.id)
    .single()
  return data
}

// Slotları listele
export async function GET(request) {
  try {
    const supabase = await createSupabaseServer()
    const actor = await getAdminUser(supabase)

    if (!actor || actor.role !== 'admin') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') // YYYY-MM-DD

    let query = supabaseAdmin
      .from('slots')
      .select('id, slot_time, capacity, reserved_count, created_at')
      .order('slot_time', { ascending: true })

    if (date) {
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)
      query = query
        .gte('slot_time', dayStart.toISOString())
        .lte('slot_time', dayEnd.toISOString())
    }

    const { data: slots, error } = await query
    if (error) throw error

    return NextResponse.json({ slots })
  } catch (err) {
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

// Slot oluştur (tekil veya toplu)
export async function POST(request) {
  try {
    const supabase = await createSupabaseServer()
    const actor = await getAdminUser(supabase)

    if (!actor || actor.role !== 'admin') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
    }

    const { slots, capacity = 3 } = await request.json()

    // slots: string[] — ISO tarih dizisi
    if (!slots || !Array.isArray(slots) || slots.length === 0) {
      return NextResponse.json({ error: 'Geçerli slot dizisi gerekli' }, { status: 400 })
    }

    if (slots.length > 100) {
      return NextResponse.json({ error: 'Tek seferde max 100 slot' }, { status: 400 })
    }

    const rows = slots.map(slot_time => ({
      slot_time,
      capacity: Number(capacity),
      reserved_count: 0,
    }))

    // Çakışanları atla (upsert)
    const { data, error } = await supabaseAdmin
      .from('slots')
      .upsert(rows, { onConflict: 'slot_time', ignoreDuplicates: true })
      .select('id, slot_time, capacity')

    if (error) throw error

    await writeLog({
      type: 'admin_action',
      actorId: actor.id,
      reason: `${data.length} slot oluşturuldu`,
      metadata: { count: data.length, capacity, date: slots[0] },
    })

    return NextResponse.json({ created: data.length, slots: data })
  } catch (err) {
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

// Slot sil
export async function DELETE(request) {
  try {
    const supabase = await createSupabaseServer()
    const actor = await getAdminUser(supabase)

    if (!actor || actor.role !== 'admin') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
    }

    const { slotId } = await request.json()
    if (!slotId) {
      return NextResponse.json({ error: 'slotId zorunlu' }, { status: 400 })
    }

    // Rezerveli slot silinemez
    const { data: slot } = await supabaseAdmin
      .from('slots')
      .select('id, reserved_count, slot_time')
      .eq('id', slotId)
      .single()

    if (!slot) {
      return NextResponse.json({ error: 'Slot bulunamadı' }, { status: 404 })
    }

    if (slot.reserved_count > 0) {
      return NextResponse.json(
        { error: 'Rezerveli slot silinemez' },
        { status: 409 }
      )
    }

    const { error } = await supabaseAdmin
      .from('slots')
      .delete()
      .eq('id', slotId)

    if (error) throw error

    await writeLog({
      type: 'admin_action',
      actorId: actor.id,
      targetId: slotId,
      reason: 'Slot silindi',
      metadata: { slot_time: slot.slot_time },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}