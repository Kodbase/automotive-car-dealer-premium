import { NextResponse } from 'next/server'
import { CONFIG } from '@/constants/config'

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
    return NextResponse.redirect(
      new URL(`/${CONFIG.defaultLocale}${pathname}`, request.url)
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}