import { NextResponse } from 'next/server'
import { getAvailableSlots } from '@/lib/engines/slot-engine'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const locationId = searchParams.get('locationId') 

    if (!date) {
      return NextResponse.json(
        { error: 'Tarih parametresi gerekli' },
        { status: 400 }
      )
    }

    // Tarih formatı kontrolü (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: 'Geçersiz tarih formatı. YYYY-MM-DD kullanın' },
        { status: 400 }
      )
    }

    const slots = await getAvailableSlots(date, locationId) 

    return NextResponse.json({ slots })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}