import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/server/supabase-server'
import supabaseAdmin from '@/lib/server/supabase-admin'
import { writeLog } from '@/lib/server/log-service'

// Staff oluştur
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
      return NextResponse.json({ error: 'Sadece admin staff oluşturabilir' }, { status: 403 })
    }

    const body = await request.json()
    const { email, password, name, phone } = body

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'email, password ve name zorunludur' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Şifre en az 8 karakter olmalıdır' },
        { status: 400 }
      )
    }

    // Supabase Auth'da kullanıcı oluştur
    const { data: authData, error: authError } = await supabaseAdmin
      .auth.admin.createUser({
        email,
        password,
        email_confirm: true
      })

    if (authError) {
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'Bu email adresi zaten kayıtlı' },
          { status: 409 }
        )
      }
      throw authError
    }

    // public.users tablosuna ekle
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        name,
        phone: phone ?? null,
        role: 'staff',
        is_verified: true
      })

    if (insertError) {
      // Auth kullanıcısını geri al
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw insertError
    }

    try {
      await writeLog({
        type: 'admin_action',
        actorId: user.id,
        targetId: authData.user.id,
        reason: 'staff_created',
        metadata: { email, name }
      })
    } catch (e) { console.error('Log yazılamadı:', e) }

    return NextResponse.json({
      success: true,
      staff: { id: authData.user.id, email, name, role: 'staff' }
    }, { status: 201 })

  } catch (error) {
    console.error('Staff oluşturma hatası:', error)
    return NextResponse.json({ error: 'Staff oluşturulamadı' }, { status: 500 })
  }
}

// Staff sil
export async function DELETE(request) {
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
      return NextResponse.json({ error: 'Sadece admin kullanıcı silebilir' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId zorunludur' }, { status: 400 })
    }

    // Kendini silemez
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Kendinizi silemezsiniz' },
        { status: 400 }
      )
    }

    // Silinecek kullanıcının rolünü kontrol et
    const { data: targetUser } = await supabaseAdmin
      .from('users')
      .select('role, email, name')
      .eq('id', userId)
      .single()

    if (!targetUser) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    }

    if (targetUser.role === 'admin') {
      return NextResponse.json(
        { error: 'Admin kullanıcı silinemez' },
        { status: 400 }
      )
    }

    // public.users'dan sil
    await supabaseAdmin.from('users').delete().eq('id', userId)

    // Auth'dan sil
    await supabaseAdmin.auth.admin.deleteUser(userId)

    try {
      await writeLog({
        type: 'admin_action',
        actorId: user.id,
        targetId: userId,
        reason: 'staff_deleted',
        metadata: { email: targetUser.email, name: targetUser.name }
      })
    } catch (e) { console.error('Log yazılamadı:', e) }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Kullanıcı silme hatası:', error)
    return NextResponse.json({ error: 'Kullanıcı silinemedi' }, { status: 500 })
  }
}