import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/server/supabase-admin'
import { sendOtpEmail } from '@/lib/server/email-service'

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Geçerli bir email adresi giriniz' },
        { status: 400 }
      )
    }

    // Rate limit: aynı email'e 1 dakika içinde tekrar gönderme
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString()
    const { data: recent } = await supabaseAdmin
      .from('verification_codes')
      .select('id')
      .eq('email', email)
      .gt('created_at', oneMinuteAgo)
      .limit(1)
      .single()

    if (recent) {
      return NextResponse.json(
        { error: 'Lütfen 1 dakika bekleyip tekrar deneyin' },
        { status: 429 }
      )
    }

    // Kod oluştur
    const code = generateCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    // Eski kodları geçersiz kıl
    await supabaseAdmin
      .from('verification_codes')
      .update({ used: true })
      .eq('email', email)
      .eq('used', false)

    // Yeni kodu kaydet
    const { error: insertError } = await supabaseAdmin
      .from('verification_codes')
      .insert({ email, code, expires_at: expiresAt })

    if (insertError) throw insertError

    // Email gönder
    await sendOtpEmail({ to: email, code, expiresInMinutes: 10 })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('OTP gönderme hatası:', error)
    return NextResponse.json(
      { error: 'Kod gönderilemedi' },
      { status: 500 }
    )
  }
}