'use client'

import { useState, useCallback } from 'react'
import { getAvailableSlots, createBooking, cancelBooking } from '@/services/client/booking.service'

const initialState = {
  selectedPackage: null,
  selectedLocation: null,
  selectedSlot: null,
  formData: {
    name: '',
    phone: '',
    plate: ''
  }
}

export function useBooking() {
  const [state, setState] = useState(initialState)
  const [slots, setSlots] = useState([])
  const [alternativeSlots, setAlternativeSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const setPackage = (pkg) => setState(prev => ({ ...prev, selectedPackage: pkg }))
  const setLocation = (loc) => setState(prev => ({ ...prev, selectedLocation: loc }))
  const setSlot = (slot) => setState(prev => ({ ...prev, selectedSlot: slot }))
  const setFormData = (data) => setState(prev => ({ ...prev, formData: { ...prev.formData, ...data } }))

  const fetchSlots = useCallback(async (date, locationId) => {
    try {
      setLoading(true)
      setError(null)
      const { slots } = await getAvailableSlots(date, locationId)
      setSlots(slots)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const submitBooking = async () => {
    try {
      setLoading(true)
      setError(null)
      setAlternativeSlots([])

      const { selectedPackage, selectedLocation, selectedSlot, formData } = state

      const result = await createBooking({
        packageId: selectedPackage.id,
        locationId: selectedLocation.id,
        slotTime: selectedSlot.slot_time,
        plate: formData.plate,
        name: formData.name,
        phone: formData.phone,
        email:      formData.email,
      })

      // Slot dolu ise alternatifler gelir
      if (result.alternativeSlots) {
        setAlternativeSlots(result.alternativeSlots)
        setError('Seçtiğiniz slot doldu. Alternatif saatler aşağıda.')
        return
      }

      setSuccess(result)
      setState(initialState)
      return result 
    } catch (err) {
      setError(err.message)
      return { success: false, reason: err.message }
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setState(initialState)
    setError(null)
    setSuccess(null)
    setAlternativeSlots([])
  }

  return {
    state,
    slots,
    alternativeSlots,
    loading,
    error,
    success,
    setPackage,
    setLocation,
    setSlot,
    setFormData,
    fetchSlots,
    submitBooking,
    reset
  }
}
