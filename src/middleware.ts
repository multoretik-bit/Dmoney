import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Simple protection example before integrating actual Supabase Auth middleware.
  // We'll skip it for DEV MVP to allow easy access unless login is implemented.
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
