import { NextResponse } from 'next/server'
import { randomBytes, createHash } from 'crypto'
import supabaseAdmin from '@/lib/server/supabase-admin'

const SESSION_TTL_MS = 48 * 60 * 60 * 1000

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { email, code } = body

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email ve kod zorunludur' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    const { data: record } = await supabaseAdmin
      .from('verification_codes')
      .select('id, expires_at')
      .eq('email', normalizedEmail)
      .eq('code', code)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!record) {
      return NextResponse.json(
        { error: 'Geçersiz veya süresi dolmuş kod' },
        { status: 400 }
      )
    }

    // Kodu kullanıldı olarak işaretle
    await supabaseAdmin
      .from('verification_codes')
      .update({ used: true })
      .eq('id', record.id)

    // Plaintext token üret (client'a gönderilecek)
    const sessionToken = randomBytes(32).toString('hex')
    const expiresAt    = new Date(Date.now() + SESSION_TTL_MS).toISOString()

    // DB'ye yalnızca hash'lenmiş token kaydet
    await supabaseAdmin
      .from('tracking_sessions')
      .insert({
        email:      normalizedEmail,
        token:      hashToken(sessionToken), // plaintext asla saklanmaz
        expires_at: expiresAt,
      })

    // Client'a plaintext token gönder (bir kez görülür, DB'de olmaz)
    return NextResponse.json({
      success:      true,
      email:        normalizedEmail,
      sessionToken, // plaintext — client localStorage'a kaydeder
      expiresAt,
    })
  } catch (error) {
    console.error('OTP doğrulama hatası:', error)
    return NextResponse.json(
      { error: 'Doğrulama başarısız' },
      { status: 500 }
    )
  }
}