import { NextResponse } from 'next/server'
import { processBooking } from '@/lib/engines/booking-engine'

let ratelimit = null

async function getRateLimiter() {
  if (ratelimit) return ratelimit

  // Upstash env tanımlıysa gerçek rate limiter kur
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    const { Ratelimit } = await import('@upstash/ratelimit')
    const { Redis }     = await import('@upstash/redis')

    ratelimit = new Ratelimit({
      redis: new Redis({
        url:   process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      }),
      limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 istek / 1 dakika
      analytics: false,
    })
  }

  return ratelimit
}

async function checkRateLimit(ip, email) {
  const limiter = await getRateLimiter()

  // Upstash yoksa (geliştirme ortamı) rate limiting atla
  if (!limiter) return { limited: false }

  const key = `book:${ip}:${email?.toLowerCase()}`
  const { success, remaining } = await limiter.limit(key)

  return { limited: !success, remaining }
}

export async function POST(request) {
  try {
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
    const { limited } = await checkRateLimit(ip, email)
    if (limited) {
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
        PLATE_BLOCKED:         403,
        SLOT_TIME_PASSED:      400,
        PACKAGE_NOT_FOUND:     404,
        LOCATION_NOT_FOUND:    404,
        SLOT_FULL:             409,
        BOOKING_FAILED:        500
      }

      return NextResponse.json(
        {
          error:            result.reason,
          alternativeSlots: result.alternativeSlots ?? null,
          blockedUntil:     result.blockedUntil ?? null
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