import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

const PLAN_FEATURES: Record<string, string> = {
  free_trial: 'período de prueba gratuito de 14 días con acceso completo',
  esencial: 'plan Esencial con POS, productos, caja, clientes y ventas',
  avanzado: 'plan Avanzado con todo lo del Esencial más reportes avanzados, múltiples sucursales y facturación ARCA',
  premium: 'plan Premium con todas las funcionalidades sin límites',
  basic: 'plan Básico con POS, productos, caja, clientes y ventas',
  pro: 'plan Pro con reportes avanzados, múltiples sucursales y facturación ARCA',
}

function buildSystemPrompt(context: {
  orgName: string
  businessType: string | null
  planName: string
  planType: string
  ownerName: string | null
  userName: string | null
}): string {
  const { orgName, businessType, planName, planType, ownerName, userName } = context

  const businessLabel = businessType ?? 'negocio'
  const planDesc = PLAN_FEATURES[planType] ?? `plan ${planName}`
  const greeting = userName ? `El usuario que está chateando se llama ${userName}.` : ''
  const ownerLine = ownerName ? `El dueño del negocio se llama ${ownerName}.` : ''

  return `Sos el asistente de soporte de Ventix, un sistema POS y CRM para negocios argentinos.

Contexto del negocio:
- Nombre del negocio: ${orgName}
- Tipo de negocio: ${businessLabel}
- Plan activo: ${planDesc}
${ownerLine}
${greeting}

Cuando el usuario mencione su negocio o haga preguntas, usá el nombre "${orgName}" para personalizar la respuesta. Dirigite al usuario por su nombre si lo sabés.

Conocés estas funcionalidades de Ventix:
- **POS (Punto de Venta)**: escanear productos por código de barras, agregar al carrito, cobrar con efectivo/débito/crédito/transferencia/Mercado Pago, dar vuelto, guardar ventas en espera.
- **Productos**: crear, editar, categorías, importar desde CSV o Excel, actualización masiva de precios, etiquetas de códigos de barra.
- **Caja**: abrir y cerrar sesiones de caja, registrar ingresos/egresos, ver historial.
- **Gastos**: registrar gastos por categoría (alquiler, servicios, etc.).
- **Clientes**: base de datos de clientes, cuentas corrientes (vender a crédito), historial de compras.
- **Proveedores**: gestión de proveedores y vinculación con productos.
- **Facturación ARCA/AFIP**: emitir facturas A, B y C electrónicas con CAE (disponible en planes Avanzado y Pro).
- **Ventas**: historial de ventas, búsqueda, exportar.
- **Reportes**: ventas por período, stock, caja (disponible en planes Avanzado y Pro).
- **Configuración**: sucursales, equipo (usuarios con roles owner/admin/cajero), suscripción.
- **PWA**: se puede instalar en el celular como app.

Reglas importantes:
- Respondés de forma amigable, corta (máximo 3-4 oraciones) y en español rioplatense informal.
- NO compartás información sensible como contraseñas, claves de API, datos de facturación, IDs internos ni datos de otros negocios.
- Si te preguntan por funcionalidades que no están en el plan actual, indicá amablemente que requieren un plan superior.
- Si no sabés algo, decís "Eso no lo sé todavía, pero podés escribirnos a soporte@ventix.ar".`
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { messages, orgId, userName } = await request.json() as {
    messages: { role: 'user' | 'model'; content: string }[]
    orgId?: string
    userName?: string | null
  }

  if (!messages?.length) {
    return NextResponse.json({ error: 'Sin mensajes' }, { status: 400 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Servicio de chat no configurado' }, { status: 503 })
  }

  // Fetch org + plan context (failures are non-fatal — fall back to generic prompt)
  let systemPrompt: string
  try {
    if (!orgId) throw new Error('no orgId')

    const [{ data: orgData }, { data: subData }, { data: ownerMember }] = await Promise.all([
      supabase.from('organizations').select('name, business_type').eq('id', orgId).single(),
      supabase
        .from('subscriptions')
        .select('plan_id, subscription_plans!inner(name, type)')
        .eq('organization_id', orgId)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', orgId)
        .eq('role', 'owner')
        .eq('is_active', true)
        .limit(1)
        .single(),
    ])

    let ownerName: string | null = null
    if (ownerMember?.user_id) {
      const { data: ownerProfile } = await supabase
        .from('profiles').select('full_name').eq('id', ownerMember.user_id).single()
      ownerName = ownerProfile?.full_name ?? null
    }

    const plan = (subData as { subscription_plans: { name: string; type: string } } | null)
      ?.subscription_plans ?? null

    systemPrompt = buildSystemPrompt({
      orgName: orgData?.name ?? 'tu negocio',
      businessType: (orgData as { business_type?: string | null } | null)?.business_type ?? null,
      planName: plan?.name ?? 'gratuito',
      planType: plan?.type ?? 'free_trial',
      ownerName,
      userName: userName ?? null,
    })
  } catch (e) {
    console.error('[chat] context fetch failed, using generic prompt:', e)
    systemPrompt = buildSystemPrompt({
      orgName: 'tu negocio',
      businessType: null,
      planName: 'gratuito',
      planType: 'free_trial',
      ownerName: null,
      userName: userName ?? null,
    })
  }

  const contents = messages.map(m => ({
    role: m.role,
    parts: [{ text: m.content }],
  }))

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 300,
    },
  }

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('[chat] Gemini error:', err)
    return NextResponse.json({ error: 'Error al procesar la consulta' }, { status: 500 })
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No pude generar una respuesta.'

  return NextResponse.json({ reply: text })
}
