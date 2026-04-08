import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import supabaseAdmin from '@/lib/server/supabase-admin'

export async function GET() {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          }
        }
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Giriş yapmanız gerekiyor' },
        { status: 401 }
      )
    }

    // Aktif booking
    const { data: activeBooking } = await supabaseAdmin
      .from('bookings')
      .select(`
        id,
        plate,
        slot_time,
        status,
        created_at,
        packages (id, name, price, duration),
        locations (id, name, address)
      `)
      .eq('user_id', user.id)
      .in('status', ['WAITING', 'ACCEPTED', 'IN_PROGRESS'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Plaka bloklu mu
    const blockedPlates = await supabaseAdmin
      .from('blocked_plates')
      .select('plate, blocked_until')
      .gt('blocked_until', new Date().toISOString())

    return NextResponse.json({
      activeBooking: activeBooking ?? null,
      blockedPlates: blockedPlates.data ?? []
    })

  } catch (error) {
    console.error('User status hatası:', error)
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}