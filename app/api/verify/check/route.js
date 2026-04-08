// app/api/verify/check/route.js

import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import supabaseAdmin from '@/lib/server/supabase-admin'

// Session token TTL: 48 saat
const SESSION_TTL_MS = 48 * 60 * 60 * 1000

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

    // Kodu bul — used kontrolü YOK (aynı kodu birden fazla cihazda girebilir)
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

    // 48 saatlik session token üret
    const sessionToken = randomBytes(32).toString('hex')
    const expiresAt    = new Date(Date.now() + SESSION_TTL_MS).toISOString()

    // DB'ye kaydet
    await supabaseAdmin
      .from('tracking_sessions')
      .insert({
        email:      normalizedEmail,
        token:      sessionToken,
        expires_at: expiresAt,
      })

    return NextResponse.json({
      success:      true,
      email:        normalizedEmail,
      sessionToken,
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