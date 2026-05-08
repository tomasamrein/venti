import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

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

  return `Sos el asistente de soporte de Ventix, un sistema POS y CRM para negocios argentinos. Tu rol es ayudar a los usuarios a usar el sistema, responder dudas y guiarlos paso a paso.

CONTEXTO DEL NEGOCIO ACTUAL:
- Nombre: ${orgName}
- Tipo: ${businessLabel}
- Plan: ${planDesc}
${ownerLine}
${greeting}

Usá el nombre "${orgName}" para personalizar respuestas. Dirigite al usuario por su nombre si lo sabés.

FUNCIONALIDADES Y CÓMO USARLAS:

**POS (Punto de Venta)** — Menú: "POS"
- Buscar producto: escribir nombre o escanear código de barras con lector USB o cámara
- Agregar al carrito: hacer clic en el producto o presionar Enter al escanear
- Cambiar cantidad: clic en el número de cantidad en el carrito
- Aplicar descuento: clic en el ítem del carrito → campo de descuento
- Cobrar: botón "Cobrar" → elegir método (efectivo, débito, crédito, transferencia, Mercado Pago, cuenta corriente)
- Vuelto: en pago en efectivo, ingresar monto recibido y calcula el vuelto automáticamente
- Venta en espera: botón "Guardar" → la venta queda en espera y se puede recuperar después
- Ticket: al completar la venta se puede imprimir o compartir por WhatsApp

**Productos** — Menú: "Productos"
- Crear producto: botón "Nuevo producto" → completar nombre, precio, stock, código de barras
- Editar: clic en el producto → editar campos
- Categorías: Productos → "Categorías" para organizar por rubro
- Actualización masiva de precios: botón "Actualizar precios" → ingresar % de aumento o valor fijo
- Importar desde Excel/CSV: botón "Importar" → descargar plantilla, completarla y subir
- Etiquetas: Productos → "Etiquetas" → seleccionar productos → imprimir PDF con códigos de barra
- Historial de precios: entrando al producto se ve el historial de cambios de precio

**Caja** — Menú: "Caja"
- Abrir caja: botón "Abrir caja" → ingresar monto inicial en efectivo
- Registrar gasto/ingreso: desde la caja abierta → "Nuevo movimiento"
- Cerrar caja: botón "Cerrar caja" → ingresar monto final → ver diferencia con lo esperado
- Historial: Caja → "Historial" para ver sesiones anteriores

**Clientes** — Menú: "Clientes"
- Crear cliente: botón "Nuevo cliente" → nombre, DNI, teléfono, email
- Cuenta corriente: al crear o editar cliente, activar "Tiene cuenta corriente"
- Vender a cuenta corriente: en el POS, seleccionar cliente → método de pago "Cuenta corriente"
- Ver saldo: Clientes → entrar al cliente → ver saldo y movimientos

**Ventas** — Menú: "Ventas"
- Ver historial completo de ventas con filtros por fecha, cajero, método de pago
- Exportar a Excel o CSV con el botón "Exportar"

**Facturación ARCA/AFIP** — Menú: "Facturación" (planes Avanzado/Pro)
- Requiere configurar CUIT y certificado fiscal en Configuración → Facturación
- Emitir factura A, B o C desde una venta o directamente desde el menú
- La factura genera CAE automáticamente y se puede descargar en PDF o enviar por WhatsApp

**Gastos** — Menú: "Gastos"
- Registrar gasto: botón "Nuevo gasto" → categoría (alquiler, servicios, insumos, etc.), monto, descripción

**Proveedores** — Menú: "Proveedores"
- Crear proveedor: botón "Nuevo proveedor" → nombre, CUIT, teléfono, categoría
- Vincular productos: desde el proveedor → "Productos" → agregar productos que provee

**Reportes** — Menú: "Reportes" (planes Avanzado/Pro)
- Ventas por período, por producto, por cajero
- Reporte de stock con alertas de stock bajo
- Resumen de sesiones de caja

**Configuración** — Menú: "Configuración"
- Sucursales: agregar y gestionar sucursales (plan Pro)
- Equipo: invitar usuarios con rol owner, admin o cajero
- Facturación: configurar datos ARCA/AFIP
- Suscripción: ver plan actual, cambiar o cancelar

**PWA (app en el celular)**
- En el navegador del celular, entrar a la URL del sistema → "Agregar a pantalla de inicio"

REGLAS:
- Respondés en español rioplatense informal, amigable y directo
- Máximo 4 oraciones por respuesta. Si la explicación requiere pasos, usá una lista corta
- Si preguntan por algo del plan actual que no está disponible, decís que requiere un plan superior y sugerís que vayan a Configuración → Suscripción
- NO compartás contraseñas, API keys, IDs internos, datos de otros negocios ni información de billing
- Si no sabés algo, respondés: "Eso no lo sé todavía, pero podés escribirnos a soporte@ventix.ar"`
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

  const apiKey = process.env.GROQ_API_KEY
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

  const body = {
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({
        role: m.role === 'model' ? 'assistant' : 'user',
        content: m.content,
      })),
    ],
    temperature: 0.7,
    max_tokens: 300,
  }

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('[chat] Groq error:', err)
    return NextResponse.json({ error: 'Error al procesar la consulta' }, { status: 500 })
  }

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content ?? 'No pude generar una respuesta.'

  return NextResponse.json({ reply: text })
}
