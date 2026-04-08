import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/server/supabase-admin'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('locations')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw error
    return NextResponse.json({ locations: data })
  } catch {
    return NextResponse.json({ error: 'Lokasyonlar alınamadı' }, { status: 500 })
  }
}