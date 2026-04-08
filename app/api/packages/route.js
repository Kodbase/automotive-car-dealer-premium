import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/server/supabase-admin'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('packages')
      .select('*, package_features(feature, sort_order)')
      .eq('is_active', true)
      .order('price', { ascending: true })

    if (error) throw error

    const packages = data.map(pkg => ({
      ...pkg,
      features: (pkg.package_features || [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(f => f.feature)
    }))

    return NextResponse.json({ packages })
  } catch {
    return NextResponse.json({ error: 'Paketler alınamadı' }, { status: 500 })
  }
}