import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import supabaseAdmin from '@/lib/server/supabase-admin'
import { writeLog } from '@/lib/server/log-service'

const VALID_KEYS = [
  'working_hours',
  'slot_duration',
  'capacity_default',
  'cancel_limit_hours',
  'max_booking_per_user'
]

// Ayarları getir
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('settings')
      .select('key, value')

    if (error) throw error

    const settings = data.reduce((acc, row) => {
      acc[row.key] = row.value
      return acc
    }, {})

    return NextResponse.json({ settings })
  } catch (error) {
    return NextResponse.json(
      { error: 'Ayarlar alınamadı' },
      { status: 500 }
    )
  }
}

// Ayar güncelle
export async function POST(request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll() { return cookieStore.getAll() } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Giriş yapmanız gerekiyor' }, { status: 401 })

    const { data: userData } = await supabaseAdmin
      .from('users').select('role').eq('id', user.id).single()

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Sadece admin ayarları güncelleyebilir' }, { status: 403 })
    }

    const body = await request.json()
    // Frontend { settings: {...} } veya direkt obje gönderebilir
    const settingsObj = body.settings || body

    const validKeys = Object.keys(settingsObj).filter(k => VALID_KEYS.includes(k))

    if (validKeys.length === 0) {
      return NextResponse.json({ error: 'Geçerli ayar bulunamadı' }, { status: 400 })
    }

    // Her key için ayrı update
    const updates = validKeys.map(key =>
      supabaseAdmin
        .from('settings')
        .update({ value: settingsObj[key] })
        .eq('key', key)
    )

    await Promise.all(updates)

    try {
      await writeLog({
        type: 'admin_action',
        actorId: user.id,
        reason: 'settings_updated',
        metadata: settingsObj
      })
    } catch {}

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Ayar güncelleme hatası:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}