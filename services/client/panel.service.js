import { apiRequest } from './api'

// Giriş yapan kullanıcı bilgisi
export async function getPanelMe() {
  return apiRequest('/api/panel/me')
}

// Dashboard istatistikleri
export async function getDashboardStats() {
  return apiRequest('/api/panel/dashboard')
}

// Tüm bookinglar (filtreli)
export async function getPanelBookings({ page = 1, limit = 20, status, date, search } = {}) {
  const params = new URLSearchParams({ page, limit })
  if (status) params.set('status', status)
  if (date) params.set('date', date)
  if (search) params.set('search', search)
  return apiRequest(`/api/panel/bookings?${params}`)
}

// Kullanıcı listesi (admin)
export async function getPanelUsers({ page = 1, limit = 20, role, search } = {}) {
  const params = new URLSearchParams({ page, limit })
  if (role) params.set('role', role)
  if (search) params.set('search', search)
  return apiRequest(`/api/panel/users?${params}`)
}

// Rol güncelle (admin)
export async function updateUserRole(userId, role) {
  return apiRequest('/api/panel/users/role', {
    method: 'POST',
    body: { userId, role }
  })
}

// Slotları getir
export async function getSlots(date) {
  const params = new URLSearchParams()
  if (date) params.set('date', date)
  return apiRequest(`/api/admin/slots?${params}`)
}

// Slot oluştur
export async function createSlots(slots, capacity) {
  return apiRequest('/api/admin/slots', {
    method: 'POST',
    body: { slots, capacity },
  })
}

// Slot sil
export async function deleteSlot(slotId) {
  return apiRequest('/api/admin/slots', {
    method: 'DELETE',
    body: { slotId },
  })
}