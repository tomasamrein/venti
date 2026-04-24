import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const registerSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  org_name: z.string().min(2),
  org_slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  branch_name: z.string().min(2),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = registerSchema.parse(body)

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[register] Missing env vars')
      return NextResponse.json(
        { error: 'Error de configuración del servidor.' },
        { status: 500 }
      )
    }

    const supabase = createAdminClient()

    // Check if slug already exists
    const { data: existingOrg, error: slugCheckError } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', data.org_slug)
      .maybeSingle()

    if (slugCheckError) {
      console.error('[register] Slug check error:', slugCheckError)
      return NextResponse.json(
        { error: 'Error al verificar disponibilidad. Intentá de nuevo.' },
        { status: 500 }
      )
    }

    if (existingOrg) {
      return NextResponse.json(
        { error: 'Ya existe un negocio con esa URL. Probá con otra.' },
        { status: 409 }
      )
    }

    // 1. Try to create auth user
    let userId: string

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      user_metadata: { full_name: data.full_name },
      email_confirm: true,
    })

    if (authError) {
      console.error('[register] Auth error:', authError.message)

      // If user already exists, check if they're orphaned (no organization)
      const isAlreadyExists = authError.message?.toLowerCase().includes('already')
        || authError.message?.toLowerCase().includes('exists')
        || authError.message?.toLowerCase().includes('duplicate')

      if (isAlreadyExists) {
        // Find the existing user
        const { data: listData } = await supabase.auth.admin.listUsers({
          page: 1,
          perPage: 1,
        })

        // Search by email through all users — use a targeted approach
        const { data: usersData } = await supabase.auth.admin.listUsers()
        const existingUser = usersData?.users?.find(
          (u) => u.email?.toLowerCase() === data.email.toLowerCase()
        )

        if (existingUser) {
          // Check if this user has any organization membership
          const { data: membership } = await supabase
            .from('organization_members')
            .select('id')
            .eq('user_id', existingUser.id)
            .maybeSingle()

          if (!membership) {
            // Orphaned user — delete and recreate
            console.log('[register] Found orphaned user, cleaning up:', existingUser.id)
            await supabase.auth.admin.deleteUser(existingUser.id)

            // Recreate the user
            const { data: newAuthData, error: newAuthError } = await supabase.auth.admin.createUser({
              email: data.email,
              password: data.password,
              user_metadata: { full_name: data.full_name },
              email_confirm: true,
            })

            if (newAuthError || !newAuthData.user) {
              console.error('[register] Recreate user error:', newAuthError)
              return NextResponse.json(
                { error: 'Error al crear la cuenta. Intentá de nuevo.' },
                { status: 400 }
              )
            }

            userId = newAuthData.user.id
          } else {
            // User exists AND has an organization — truly already registered
            return NextResponse.json(
              { error: 'Ese email ya está registrado con un negocio. Intentá ingresar desde el login.' },
              { status: 409 }
            )
          }
        } else {
          return NextResponse.json(
            { error: 'Error al verificar la cuenta. Intentá con otro email.' },
            { status: 400 }
          )
        }
      } else {
        return NextResponse.json(
          { error: authError.message || 'Error al crear la cuenta' },
          { status: 400 }
        )
      }
    } else if (!authData?.user) {
      return NextResponse.json(
        { error: 'Error al crear la cuenta' },
        { status: 400 }
      )
    } else {
      userId = authData.user.id
    }

    const trialEnds = new Date()
    trialEnds.setDate(trialEnds.getDate() + 14)

    // 2. Create organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: data.org_name,
        slug: data.org_slug,
        trial_ends_at: trialEnds.toISOString(),
      })
      .select('id')
      .single()

    if (orgError || !org) {
      console.error('[register] Org error:', orgError)
      await supabase.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: 'Error al crear el negocio. Intentá de nuevo.' },
        { status: 500 }
      )
    }

    // 3. Create main branch
    const { data: branch, error: branchError } = await supabase
      .from('branches')
      .insert({ organization_id: org.id, name: data.branch_name, is_main: true })
      .select('id')
      .single()

    if (branchError || !branch) {
      console.error('[register] Branch error:', branchError)
      await supabase.auth.admin.deleteUser(userId)
      await supabase.from('organizations').delete().eq('id', org.id)
      return NextResponse.json(
        { error: 'Error al crear la sucursal. Intentá de nuevo.' },
        { status: 500 }
      )
    }

    // 4. Add user as owner
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id: userId,
        role: 'owner',
        branch_id: branch.id,
        joined_at: new Date().toISOString(),
      })

    if (memberError) {
      console.error('[register] Member error:', memberError)
      await supabase.auth.admin.deleteUser(userId)
      await supabase.from('organizations').delete().eq('id', org.id)
      return NextResponse.json(
        { error: 'Error al configurar la cuenta. Intentá de nuevo.' },
        { status: 500 }
      )
    }

    // 5. Create trial subscription (non-blocking)
    try {
      const { data: plan } = await supabase
        .from('subscription_plans')
        .select('id')
        .eq('type', 'free_trial')
        .maybeSingle()

      if (plan) {
        await supabase.from('subscriptions').insert({
          organization_id: org.id,
          plan_id: plan.id,
          status: 'trialing',
          current_period_start: new Date().toISOString(),
          current_period_end: trialEnds.toISOString(),
        })
      }
    } catch (subError) {
      console.error('[register] Subscription error (non-fatal):', subError)
    }

    return NextResponse.json({
      success: true,
      slug: data.org_slug,
      userId,
    })
  } catch (error) {
    console.error('[register] Unexpected error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos. Revisá los campos.' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Error interno del servidor. Intentá de nuevo.' },
      { status: 500 }
    )
  }
}
