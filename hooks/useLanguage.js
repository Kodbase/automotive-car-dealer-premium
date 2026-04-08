'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { getTranslations } from '@/i18n'

export function useLanguage() {
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  const langFromPath = pathname?.split('/')[1]
  const currentLang = ['tr', 'en'].includes(langFromPath) ? langFromPath : 'tr'

  useEffect(() => {
    setMounted(true)
  }, [])

  const t = getTranslations(currentLang)

  const switchLanguage = (newLang) => {
    const segments = pathname.split('/')
    segments[1] = newLang
    router.push(segments.join('/'))
  }

  return { lang: currentLang, t, switchLanguage, mounted }
}