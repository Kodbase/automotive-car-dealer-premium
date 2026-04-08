import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/server/supabase-server'
import supabaseAdmin from '@/lib/server/supabase-admin'
import { writeLog } from '@/lib/server/log-service'

async function getAuthenticatedAdmin() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') return null
  return profile
}

// GET /api/admin/packages — features dizisiyle birlikte
export async function GET() {
  try {
    const admin = await getAuthenticatedAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const { data: packages, error } = await supabaseAdmin
      .from('packages')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Her paket için features'ları çek
    const packagesWithFeatures = await Promise.all(
      packages.map(async (pkg) => {
        const { data: features } = await supabaseAdmin
          .from('package_features')
          .select('id, feature, sort_order')
          .eq('package_id', pkg.id)
          .order('sort_order', { ascending: true })

        return {
          ...pkg,
          features: features || [],
        }
      })
    )

    return NextResponse.json({ packages: packagesWithFeatures })
  } catch (err) {
    console.error('GET /api/admin/packages error:', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

// POST /api/admin/packages — yeni paket + features
export async function POST(request) {
  try {
    const admin = await getAuthenticatedAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const body = await request.json()
    const { name, price, duration, description, is_active = true, features = [] } = body

    if (!name || !price || !duration) {
      return NextResponse.json({ error: 'Ad, fiyat ve süre zorunludur' }, { status: 400 })
    }

    // Paketi oluştur
    const { data: pkg, error: pkgError } = await supabaseAdmin
      .from('packages')
      .insert({ name, price: Number(price), duration: Number(duration), description, is_active })
      .select()
      .single()

    if (pkgError) throw pkgError

    // Features'ları ekle
    if (features.length > 0) {
      const featureRows = features.map((feature, index) => ({
        package_id: pkg.id,
        feature: feature.trim(),
        sort_order: index,
      }))

      const { error: featError } = await supabaseAdmin
        .from('package_features')
        .insert(featureRows)

      if (featError) throw featError
    }

    try {
      await writeLog({
        type: 'admin_action',
        actorId: admin.id,
        targetId: pkg.id,
        reason: `Yeni paket oluşturuldu: ${name}`,
        metadata: { packageName: name, price, duration },
      })
    } catch (logErr) {
      console.error('Log yazılamadı:', logErr)
    }

    return NextResponse.json({ success: true, package: { ...pkg, features } })
  } catch (err) {
    console.error('POST /api/admin/packages error:', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

// PATCH /api/admin/packages — paket güncelle + features sync
export async function PATCH(request) {
  try {
    const admin = await getAuthenticatedAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const body = await request.json()
    const { id, features, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Paket ID zorunludur' }, { status: 400 })
    }

    // Fiyat/süre varsa number'a çevir
    if (updates.price !== undefined) updates.price = Number(updates.price)
    if (updates.duration !== undefined) updates.duration = Number(updates.duration)

    // Paketi güncelle
    const { data: pkg, error: pkgError } = await supabaseAdmin
      .from('packages')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (pkgError) throw pkgError

    // Features güncelleme — mevcut hepsini sil, yenilerini ekle
    if (features !== undefined) {
      const { error: deleteError } = await supabaseAdmin
        .from('package_features')
        .delete()
        .eq('package_id', id)

      if (deleteError) throw deleteError

      if (features.length > 0) {
        const featureRows = features.map((feature, index) => ({
          package_id: id,
          feature: typeof feature === 'string' ? feature.trim() : feature.feature.trim(),
          sort_order: index,
        }))

        const { error: insertError } = await supabaseAdmin
          .from('package_features')
          .insert(featureRows)

        if (insertError) throw insertError
      }
    }

    try {
      await writeLog({
        type: 'admin_action',
        actorId: admin.id,
        targetId: id,
        reason: `Paket güncellendi: ${pkg.name}`,
        metadata: { updates, featuresCount: features?.length },
      })
    } catch (logErr) {
      console.error('Log yazılamadı:', logErr)
    }

    return NextResponse.json({ success: true, package: pkg })
  } catch (err) {
    console.error('PATCH /api/admin/packages error:', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}