export { proxy } from '@/lib/config/proxy'

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icon.svg|images|.*\\..*).*)',
  ],
}
