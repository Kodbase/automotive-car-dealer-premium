import { NextResponse } from 'next/server'
import { processBooking } from '@/lib/engines/booking-engine'

// In-memory rate limiter (IP + email bazlı, 5 istek/dakika)
// Production'da Upstash Redis ile değiştirin
const rateLimitMap = new Map()

function getRateLimitKey(ip, email) {
  return `${ip}:${email?.toLowerCase()}`
}

function isRateLimited(key) {
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 dakika
  const maxRequests = 5

  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }

  const entry = rateLimitMap.get(key)

  if (now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }

  if (entry.count >= maxRequests) {
    return true
  }

  entry.count++
  return false
}

// Stale entry temizliği (bellek şişmesini önler)
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) rateLimitMap.delete(key)
  }
}, 5 * 60 * 1000)

export async function POST(request) {
  try {
    // IP al
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'

    const body = await request.json()
    const { packageId, locationId, slotTime, plate, name, phone, email } = body

    if (!packageId || !locationId || !slotTime || !plate || !email || !name || !phone) {
      return NextResponse.json({ error: 'Tüm alanlar zorunludur' }, { status: 400 })
    }

    // Rate limit kontrolü
    const rlKey = getRateLimitKey(ip, email)
    if (isRateLimited(rlKey)) {
      return NextResponse.json(
        { error: 'Çok fazla istek gönderdiniz. Lütfen bir dakika bekleyin.' },
        { status: 429 }
      )
    }

    const plateRegex = /^[0-9]{2}[A-Z]{1,3}[0-9]{2,4}$/
    if (!plateRegex.test(plate.toUpperCase().replace(/\s/g, ''))) {
      return NextResponse.json({ error: 'Geçersiz plaka formatı' }, { status: 400 })
    }

    const result = await processBooking({
      plate,
      packageId,
      locationId,
      slotTime,
      email,
      name,
      phone
    })

    if (!result.success) {
      const statusMap = {
        ACTIVE_BOOKING_EXISTS: 409,
        PLATE_BLOCKED: 403,
        SLOT_TIME_PASSED: 400,
        PACKAGE_NOT_FOUND: 404,
        LOCATION_NOT_FOUND: 404,
        SLOT_FULL: 409,
        BOOKING_FAILED: 500
      }

      return NextResponse.json(
        {
          error: result.reason,
          alternativeSlots: result.alternativeSlots ?? null,
          blockedUntil: result.blockedUntil ?? null
        },
        { status: statusMap[result.reason] ?? 500 }
      )
    }

    return NextResponse.json(result, { status: 201 })

  } catch (error) {
    console.error('Book API error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
