import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/server/supabase-admin'
import { createHash } from 'crypto'

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

// OTP kodu ile doğrulama
async function verifyByOtp(email, code) {
  const { data, error } = await supabaseAdmin
    .from('verification_codes')
    .select('id, expires_at')
    .eq('email', email)
    .eq('code', code)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return false
  if (new Date(data.expires_at) < new Date()) return false
  return true
}

// Session token ile doğrulama (SHA-256 hash karşılaştırma)
async function verifyBySessionToken(email, token) {
  const hashedToken = hashToken(token)

  const { data, error } = await supabaseAdmin
    .from('tracking_sessions')
    .select('id, expires_at')
    .eq('email', email)
    .eq('token', hashedToken)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return false
  return true
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const email        = searchParams.get('email')?.toLowerCase().trim()
    const code         = searchParams.get('code')         || ''
    const sessionToken = searchParams.get('sessionToken') || ''

    if (!email || (!code && !sessionToken)) {
      return NextResponse.json(
        { error: 'Email ve kod veya sessionToken zorunludur' },
        { status: 400 }
      )
    }

    let valid = false

    if (sessionToken) {
      valid = await verifyBySessionToken(email, sessionToken)
    }

    if (!valid && code) {
      valid = await verifyByOtp(email, code)
    }

    if (!valid) {
      return NextResponse.json(
        { error: 'Geçersiz veya süresi dolmuş oturum' },
        { status: 401 }
      )
    }

    const { data: settingsRows } = await supabaseAdmin
      .from('settings')
      .select('key, value')
      .eq('key', 'cancel_limit_hours')

    const cancelLimitHours = Number(settingsRows?.[0]?.value ?? 2)

    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        id,
        plate,
        slot_time,
        status,
        reschedule_count,
        created_at,
        packages  ( id, name, price, duration ),
        locations ( id, name, address )
      `)
      .eq('email', email)
      .order('slot_time', { ascending: false })

    if (error) throw error

    const now = new Date()

    const enriched = (bookings || []).map((b) => {
      const slotTime  = new Date(b.slot_time)
      const diffHours = (slotTime - now) / (1000 * 60 * 60)
      const isActive  = ['ACCEPTED', 'IN_PROGRESS'].includes(b.status)
      const upcoming  = slotTime > now
      const inLimit   = diffHours >= cancelLimitHours

      return {
        ...b,
        is_cancellable:   isActive && upcoming && inLimit,
        is_reschedulable: isActive && upcoming && inLimit,
      }
    })

    return NextResponse.json({ bookings: enriched })
  } catch (err) {
    console.error('GET /api/tracking/bookings error:', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
