import { NextRequest, NextResponse } from 'next/server';

const locales = ['en', 'fi'];
const defaultLocale = 'en';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Check if pathname already has a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return;

  // Redirect to default locale
  const locale = defaultLocale;
  return NextResponse.redirect(
    new URL(`/${locale}${pathname}`, request.url)
  );
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icons|assets).*)',
  ],
};