import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Términos y condiciones',
  description: 'Términos y condiciones de uso del servicio Ventix.',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <div className="text-sm text-slate-600 leading-relaxed space-y-2">{children}</div>
    </div>
  )
}

export default function TerminosPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="mb-10">
        <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">Legal</p>
        <h1 className="text-3xl font-black text-slate-900">Términos y condiciones</h1>
        <p className="text-sm text-slate-400 mt-2">Última actualización: mayo 2026</p>
      </div>

      <div className="space-y-10 border-t border-slate-100 pt-10">
        <Section title="1. Aceptación de los términos">
          <p>
            Al registrarte y utilizar Ventix ("el Servicio"), aceptás estos Términos y Condiciones en su totalidad.
            Si no estás de acuerdo, no podés usar el Servicio.
          </p>
          <p>
            El uso continuado del Servicio tras cualquier modificación implica la aceptación de los nuevos términos.
            Te notificaremos cambios relevantes por email o mediante el sistema de notificaciones de la plataforma.
          </p>
        </Section>

        <Section title="2. Descripción del Servicio">
          <p>
            Ventix es un sistema de punto de venta (POS) y CRM en la nube ("Software as a Service") orientado a
            negocios minoristas argentinos. Incluye funcionalidades de gestión de ventas, stock, facturación electrónica,
            cuentas corrientes, reportes y otras herramientas de gestión comercial.
          </p>
          <p>
            Ventix es una <strong>herramienta de software</strong>. No brinda asesoramiento contable, fiscal, jurídico
            ni impositivo. Cualquier decisión de negocio o fiscal tomada a partir del uso del sistema es responsabilidad
            exclusiva del usuario.
          </p>
        </Section>

        <Section title="3. Responsabilidades del usuario">
          <p>Al usar Ventix, aceptás que:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Sos el único responsable de la veracidad y exactitud de la información que cargás (productos, precios, CUIT, certificados fiscales, etc.).</li>
            <li>El uso correcto de la facturación electrónica según la normativa de ARCA/AFIP es responsabilidad exclusiva tuya. Ventix provee la herramienta técnica, no valida obligatoriedad ni criterios fiscales.</li>
            <li>No usarás el Servicio para actividades ilegales, fraudulentas o que violen la normativa argentina vigente.</li>
            <li>Sos responsable de mantener la confidencialidad de tus credenciales de acceso.</li>
            <li>Notificarás a Ventix ante cualquier uso no autorizado de tu cuenta.</li>
          </ul>
        </Section>

        <Section title="4. Suscripción y pagos">
          <p>
            El Servicio se cobra mediante suscripción mensual recurrente a través de Mercado Pago. Al suscribirte,
            autorizás el débito automático mensual por el monto del plan elegido.
          </p>
          <p>
            Durante el período de lanzamiento, los primeros 3 (tres) meses se facturarán al 50% del precio regular.
            Transcurrido ese período, el cobro pasará automáticamente al precio completo del plan.
          </p>
          <p>
            Podés cancelar tu suscripción en cualquier momento desde Configuración → Suscripción. La cancelación
            es efectiva al final del período ya abonado. No se realizan reembolsos por períodos parciales.
          </p>
        </Section>

        <Section title="5. Período de prueba gratuita">
          <p>
            Nuevos usuarios tienen acceso a 14 (catorce) días de prueba gratuita con acceso a las funcionalidades
            del plan elegido, sin necesidad de tarjeta de crédito. Al finalizar el período de prueba, el Servicio
            se suspende hasta que el usuario seleccione un plan pago.
          </p>
        </Section>

        <Section title="6. Limitación de responsabilidad">
          <p>
            En la máxima medida permitida por la ley argentina, Ventix no será responsable por:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Pérdidas económicas derivadas del uso incorrecto del sistema.</li>
            <li>Errores u omisiones en la facturación electrónica por datos incorrectos provistos por el usuario.</li>
            <li>Interrupciones del servicio por causas fuera de nuestro control (fallas de terceros, cortes de internet, fuerza mayor).</li>
            <li>Pérdida de datos por negligencia del usuario.</li>
          </ul>
          <p>
            La responsabilidad máxima de Ventix ante cualquier reclamo no superará el importe abonado por el usuario
            en los últimos 3 (tres) meses de suscripción.
          </p>
        </Section>

        <Section title="7. Propiedad intelectual">
          <p>
            Todo el software, diseño, código, marca y contenido de Ventix son propiedad exclusiva de sus desarrolladores.
            El usuario recibe una licencia de uso limitada, no exclusiva e intransferible mientras tenga una suscripción activa.
          </p>
        </Section>

        <Section title="8. Modificaciones del servicio">
          <p>
            Ventix puede modificar, suspender o discontinuar funcionalidades del Servicio con aviso previo razonable.
            En caso de discontinuación total del Servicio, se notificará con al menos 30 días de anticipación.
          </p>
        </Section>

        <Section title="9. Ley aplicable">
          <p>
            Estos términos se rigen por las leyes de la República Argentina. Cualquier disputa se someterá a la
            jurisdicción de los tribunales ordinarios de la Ciudad de Córdoba, Argentina.
          </p>
        </Section>

        <Section title="10. Contacto">
          <p>
            Para consultas sobre estos términos, escribinos a{' '}
            <a href="mailto:legal@ventix.com.ar" className="text-emerald-600 hover:underline font-medium">
              legal@ventix.com.ar
            </a>
            {' '}o por WhatsApp al número de soporte.
          </p>
        </Section>
      </div>
    </div>
  )
}
