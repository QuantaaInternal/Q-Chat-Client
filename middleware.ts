import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseMiddlewareClient } from './src/lib/supabase/serverClient';

const PROTECTED_PREFIXES = ['/dashboard', '/playground'];
const AUTH_PAGES = ['/login'];

const isPathMatched = (pathname: string, prefixes: string[]) =>
  prefixes.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

const copyCookies = (from: NextResponse, to: NextResponse) => {
  from.cookies.getAll().forEach(cookie => {
    to.cookies.set(cookie);
  });
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const { supabase, response } = createSupabaseMiddlewareClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isPathMatched(pathname, PROTECTED_PREFIXES) && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', pathname);

    const redirectResponse = NextResponse.redirect(loginUrl);
    copyCookies(response, redirectResponse);
    return redirectResponse;
  }

  if (isPathMatched(pathname, AUTH_PAGES) && user) {
    const redirectResponse = NextResponse.redirect(new URL('/', request.url));
    copyCookies(response, redirectResponse);
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/playground/:path*', '/login'],
};

