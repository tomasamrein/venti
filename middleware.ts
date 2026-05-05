import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Public routes that never need auth
  const isPublic = pathname === '/' ||
    pathname.startsWith('/(landing)') ||
    pathname.startsWith('/precios') ||
    pathname.startsWith('/funcionalidades') ||
    pathname.startsWith('/contacto') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/registro') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/invite') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')

  if (isPublic) return supabaseResponse

  // Auth guard — must be logged in for /[orgSlug]/* and /admin/*
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Super-admin guard for /admin/*
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

  // Org routes: /[orgSlug]/*
  // Extract slug — path looks like /mi-negocio/dashboard
  const segments = pathname.split('/').filter(Boolean)
  const orgSlug = segments[0]
  if (!orgSlug) return supabaseResponse

  // Skip non-org routes
  const nonOrgPrefixes = ['api', '_next', 'admin', 'login', 'registro', 'favicon']
  if (nonOrgPrefixes.includes(orgSlug)) return supabaseResponse

  // Check org membership
  const { data: org } = await supabase
    .from('organizations')
    .select('id, is_active')
    .eq('slug', orgSlug)
    .single()

  if (!org) return NextResponse.redirect(new URL('/login', request.url))

  const { data: member } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', org.id)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!member) return NextResponse.redirect(new URL('/login', request.url))

  // Block past_due orgs — allow only configuracion/suscripcion
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('organization_id', org.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (sub?.status === 'past_due' || sub?.status === 'canceled') {
    const allowedPath = `/${orgSlug}/configuracion/suscripcion`
    if (!pathname.startsWith(allowedPath)) {
      return NextResponse.redirect(new URL(allowedPath, request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
