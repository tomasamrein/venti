import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Public routes — always allow
  if (
    pathname === '/' ||
    pathname.startsWith('/precios') ||
    pathname.startsWith('/funcionalidades') ||
    pathname.startsWith('/contacto') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/registro') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/invite') ||
    pathname.startsWith('/api/webhooks') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return supabaseResponse
  }

  // Unauthenticated → login
  if (!user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Super-admin routes
  if (pathname.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_super_admin) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return supabaseResponse
  }

  // App routes: /<orgSlug>/...
  // Extract org slug from path (first segment after /)
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length > 0) {
    const orgSlug = segments[0]

    // Skip known non-org prefixes
    if (!['api', 'admin', 'offline'].includes(orgSlug)) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id, is_active')
        .eq('slug', orgSlug)
        .single()

      if (!org) {
        return NextResponse.redirect(new URL('/', request.url))
      }

      if (!org.is_active) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('error', 'org_inactive')
        return NextResponse.redirect(url)
      }

      const { data: member } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', org.id)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (!member) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js).*)',
  ],
}
