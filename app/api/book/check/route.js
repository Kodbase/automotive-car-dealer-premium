import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/server/supabase-admin'

// GET /api/book/check?plate=16ABC123
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const plate = searchParams.get('plate')?.toUpperCase().trim()

    if (!plate) {
      return NextResponse.json({ error: 'Plaka zorunludur' }, { status: 400 })
    }

    // Aktif booking var mı?
    const { data: activeBooking } = await supabaseAdmin
      .from('bookings')
      .select('id, plate, slot_time, status, email, packages(name), locations(name)')
      .eq('plate', plate)
      .in('status', ['WAITING', 'ACCEPTED', 'IN_PROGRESS'])
      .single()

    if (activeBooking) {
      return NextResponse.json({
        hasActiveBooking: true,
        booking: activeBooking
      })
    }

    // Plaka bloklu mu?
    const { data: blocked } = await supabaseAdmin
      .from('blocked_plates')
      .select('blocked_until, reason')
      .eq('plate', plate)
      .gt('blocked_until', new Date().toISOString())
      .single()

    if (blocked) {
      return NextResponse.json({
        hasActiveBooking: false,
        isBlocked: true,
        blockedUntil: blocked.blocked_until
      })
    }

    return NextResponse.json({ hasActiveBooking: false, isBlocked: false })
  } catch (err) {
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}