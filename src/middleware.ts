import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Protected routes
  const protectedPaths = ['/dashboard', '/chat', '/agents', '/projects', '/tokens', '/deploy', '/logs', '/threads', '/artifacts', '/skills', '/market']
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))

  // Check session cookie
  const sessionToken = request.cookies.get('lobster_session')?.value
  const isAuthenticated = !!sessionToken

  // Redirect unauthenticated users to auth page
  if (isProtectedPath && !isAuthenticated) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth page
  if (isAuthenticated && request.nextUrl.pathname.startsWith('/auth')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}