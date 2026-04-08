import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/server/supabase-server'
import supabaseAdmin from '@/lib/server/supabase-admin'

export async function GET() {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const { data: userData, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, phone, role, is_verified, created_at')
      .eq('id', user.id)
      .single()

    if (error || !userData) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    }

    if (!['staff', 'admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Panel erişimi yok' }, { status: 403 })
    }

    return NextResponse.json({ user: userData })
  } catch (err) {
    console.error('Panel me error:', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
