import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Skip middleware for desktop builds
  if (process.env.DESKTOP_BUILD === "1") {
    return NextResponse.next()
  }

  const response = NextResponse.next()

  // Add basic CSP for security
  const isDev = process.env.NODE_ENV === "development"
  
  if (isDev) {
    response.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; connect-src 'self' wss: https:;"
    )
  }

  return response
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
} 