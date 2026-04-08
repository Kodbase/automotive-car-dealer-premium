import { apiRequest } from './api'

// Müsait slotları getir
export async function getAvailableSlots(date, locationId) {
  const params = new URLSearchParams({ date })
  if (locationId) params.set('locationId', locationId)
  return apiRequest(`/api/slots/available?${params}`)
}

// Booking oluştur
export async function createBooking(bookingData) {
  return apiRequest('/api/book', {
    method: 'POST',
    body: bookingData
  })
}

// Booking iptal et
export async function cancelBooking(bookingId, reason) {
  return apiRequest('/api/cancel', {
    method: 'POST',
    body: { bookingId, reason }
  })
}

// Kullanıcının aktif bookingini getir
export async function getUserBookingStatus() {
  return apiRequest('/api/user/status')
}