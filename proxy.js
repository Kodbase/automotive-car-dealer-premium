import { NextResponse } from 'next/server'
import { CONFIG } from '@/constants/config'

// Güvenli pathname whitelist kontrolü
function isSafePath(pathname) {
  // Boş, çift slash veya protokol içeren path'leri reddet
  if (!pathname || pathname.includes('//') || /^[a-z][a-z0-9+.-]*:/i.test(pathname)) {
    return false
  }
  // Sadece slash, harf, rakam, tire, alt çizgi, nokta ve yüzde ile başlamalı
  return /^\/[a-zA-Z0-9\-_./~%]*$/.test(pathname)
}

export function proxy(request) {
  const { pathname } = request.nextUrl

  // API ve static dosyaları atla
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/panel') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Dil prefix kontrolü
  const pathnameHasLocale = CONFIG.locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (!pathnameHasLocale) {
    // Open redirect koruması: path güvenli değilse root'a yönlendir
    const safePath = isSafePath(pathname) ? pathname : '/'
    return NextResponse.redirect(
      new URL(`/${CONFIG.defaultLocale}${safePath}`, request.url)
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}
