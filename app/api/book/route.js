import { NextResponse } from 'next/server'
import { processBooking } from '@/lib/engines/booking-engine'

export async function POST(request) {

  try {
    const body = await request.json()

    const { packageId, locationId, slotTime, plate, name, phone, email } = body

    if (!packageId || !locationId || !slotTime || !plate || !email || !name || !phone) {
      return NextResponse.json({ error: 'Tüm alanlar zorunludur' }, { status: 400 })
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
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}