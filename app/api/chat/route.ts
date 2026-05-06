import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

const SYSTEM_PROMPT = `Sos el asistente de soporte de Ventix, un sistema de punto de venta (POS) y CRM para kioscos, almacenes y negocios minoristas argentinos. Respondés preguntas sobre cómo usar el sistema.

Conocés estas funcionalidades de Ventix:
- **POS (Punto de Venta)**: escanear productos por código de barras, agregar al carrito, cobrar con efectivo/débito/crédito/transferencia/Mercado Pago, dar vuelto, guardar ventas en espera.
- **Productos**: crear, editar, categorías, importar desde CSV o Excel, actualización masiva de precios, etiquetas de códigos de barra.
- **Caja**: abrir y cerrar sesiones de caja, registrar ingresos/egresos, ver historial.
- **Gastos**: registrar gastos por categoría (alquiler, servicios, etc.).
- **Clientes**: base de datos de clientes, cuentas corrientes (vender a crédito), historial de compras.
- **Proveedores**: gestión de proveedores y vinculación con productos.
- **Facturación ARCA/AFIP**: emitir facturas A, B y C electrónicas con CAE.
- **Ventas**: historial de ventas, búsqueda, exportar.
- **Reportes**: ventas por período, stock, caja.
- **Configuración**: sucursales, equipo (usuarios con roles owner/admin/cajero), suscripción.
- **PWA**: se puede instalar en el celular como app.

Respondés de forma amigable, corta (máximo 3-4 oraciones) y en español rioplatense informal. Si no sabés algo, decís "Eso no lo sé todavía, pero podés escribirnos a soporte@ventix.ar".`

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { messages } = await request.json() as {
    messages: { role: 'user' | 'model'; content: string }[]
  }

  if (!messages?.length) {
    return NextResponse.json({ error: 'Sin mensajes' }, { status: 400 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Servicio de chat no configurado' }, { status: 503 })
  }

  const contents = messages.map(m => ({
    role: m.role,
    parts: [{ text: m.content }],
  }))

  const body = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
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
