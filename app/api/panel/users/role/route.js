import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/server/supabase-server'
import supabaseAdmin from '@/lib/server/supabase-admin'
import { writeLog } from '@/lib/server/log-service'

const VALID_ROLES = ['user', 'staff', 'admin']

export async function POST(request) {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const { data: actor } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('id', user.id)
      .single()

    if (!actor || actor.role !== 'admin') {
      return NextResponse.json({ error: 'Sadece admin rol değiştirebilir' }, { status: 403 })
    }

    const { userId, role } = await request.json()

    if (!userId || !role) {
      return NextResponse.json({ error: 'userId ve role zorunlu' }, { status: 400 })
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Geçersiz rol' }, { status: 400 })
    }

    if (userId === actor.id) {
      return NextResponse.json({ error: 'Kendi rolünüzü değiştiremezsiniz' }, { status: 400 })
    }

    const { data: targetUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, name, role')
      .eq('id', userId)
      .single()

    if (fetchError || !targetUser) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update({ role })
      .eq('id', userId)

    if (error) throw error

    await writeLog({
      type: 'admin_action',
      actorId: actor.id,
      targetId: userId,
      reason: `Rol değiştirildi: ${targetUser.role} → ${role}`,
      metadata: { old_role: targetUser.role, new_role: role, target_name: targetUser.name }
    })

    return NextResponse.json({ success: true, userId, role })
  } catch (err) {
    console.error('Panel users role error:', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
