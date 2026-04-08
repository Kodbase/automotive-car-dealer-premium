import { NextResponse } from 'next/server'
import { sendContactEmail } from '@/lib/server/email-service'

const MAX_NAME_LENGTH    = 100
const MAX_EMAIL_LENGTH   = 254
const MAX_MESSAGE_LENGTH = 2000

export async function POST(req) {
  try {
    const { name, email, message } = await req.json()

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: 'Tüm alanlar zorunludur.' },
        { status: 400 }
      )
    }

    // Uzunluk sınırları
    if (name.trim().length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        { error: `Ad Soyad en fazla ${MAX_NAME_LENGTH} karakter olabilir.` },
        { status: 400 }
      )
    }

    if (email.trim().length > MAX_EMAIL_LENGTH) {
      return NextResponse.json(
        { error: 'Geçerli bir e-posta adresi girin.' },
        { status: 400 }
      )
    }

    if (message.trim().length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Mesaj en fazla ${MAX_MESSAGE_LENGTH} karakter olabilir.` },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Geçerli bir e-posta adresi girin.' },
        { status: 400 }
      )
    }

    const { ok } = await sendContactEmail({
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
    })

    if (!ok) {
      return NextResponse.json(
        { error: 'Mesaj gönderilemedi. Lütfen tekrar deneyin.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Contact API hatası:', err)
    return NextResponse.json(
      { error: 'Beklenmeyen bir hata oluştu.' },
      { status: 500 }
    )
  }
}
