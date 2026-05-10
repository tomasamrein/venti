import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description: 'Política de privacidad y tratamiento de datos personales de Ventix.',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <div className="text-sm text-slate-600 leading-relaxed space-y-2">{children}</div>
    </div>
  )
}

export default function PrivacidadPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="mb-10">
        <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">Legal</p>
        <h1 className="text-3xl font-black text-slate-900">Política de privacidad</h1>
        <p className="text-sm text-slate-400 mt-2">Última actualización: mayo 2026</p>
      </div>

      <div className="space-y-10 border-t border-slate-100 pt-10">
        <Section title="1. Responsable del tratamiento">
          <p>
            El responsable del tratamiento de los datos personales es Ventix, desarrollado por Tomás Amrein
            (Argentina). Contacto:{' '}
            <a href="mailto:privacidad@ventix.com.ar" className="text-emerald-600 hover:underline font-medium">
              privacidad@ventix.com.ar
            </a>
          </p>
        </Section>

        <Section title="2. Datos que recopilamos">
          <p>Recopilamos los siguientes datos para brindar el Servicio:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Datos de cuenta:</strong> nombre, email, contraseña (hasheada), número de teléfono.</li>
            <li><strong>Datos del negocio:</strong> nombre del comercio, CUIT, dirección, información fiscal.</li>
            <li><strong>Datos operativos:</strong> productos, precios, ventas, clientes, stock y movimientos de caja que cargás en el sistema.</li>
            <li><strong>Datos de pago:</strong> no almacenamos datos de tarjetas. Los pagos son procesados directamente por Mercado Pago.</li>
            <li><strong>Datos técnicos:</strong> dirección IP, tipo de navegador, dispositivo, logs de acceso. Se usan para seguridad y diagnóstico.</li>
          </ul>
        </Section>

        <Section title="3. Cómo usamos tus datos">
          <p>Usamos tus datos exclusivamente para:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Brindar y mejorar el Servicio.</li>
            <li>Gestionar tu suscripción y cobros.</li>
            <li>Enviarte notificaciones del sistema (actualizaciones, alertas de stock, anuncios importantes).</li>
            <li>Responder consultas de soporte.</li>
            <li>Cumplir obligaciones legales.</li>
          </ul>
          <p>
            <strong>No vendemos, cedemos ni compartimos tus datos con terceros</strong> con fines comerciales o
            publicitarios. Nunca.
          </p>
        </Section>

        <Section title="4. Proveedores de servicios">
          <p>
            Para brindar el Servicio utilizamos terceros que actúan como encargados del tratamiento:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Supabase Inc.</strong> (base de datos en la nube, región São Paulo). Todos los datos se almacenan en servidores de AWS en Brasil. Supabase cumple con SOC 2 Type II.</li>
            <li><strong>Mercado Pago S.A.</strong> (procesamiento de pagos). Solo reciben información necesaria para procesar tu suscripción.</li>
            <li><strong>Vercel Inc.</strong> (hosting de la aplicación web).</li>
          </ul>
          <p>
            Estos proveedores están contractualmente obligados a tratar tus datos únicamente para los fines del Servicio
            y a mantener medidas de seguridad adecuadas.
          </p>
        </Section>

        <Section title="5. Almacenamiento y seguridad">
          <p>
            Tus datos se almacenan en servidores ubicados en São Paulo, Brasil (AWS). Utilizamos cifrado en tránsito
            (TLS 1.2+) y en reposo. Las contraseñas se almacenan con hash bcrypt. El acceso a los datos está
            protegido por Row Level Security (RLS) a nivel de base de datos, garantizando que cada negocio solo
            acceda a sus propios datos.
          </p>
        </Section>

        <Section title="6. Tus derechos (LPDP Argentina)">
          <p>
            Conforme a la Ley 25.326 de Protección de Datos Personales de Argentina, tenés derecho a:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Acceso:</strong> solicitar qué datos personales tenemos sobre vos.</li>
            <li><strong>Rectificación:</strong> corregir datos incorrectos o desactualizados.</li>
            <li><strong>Supresión ("derecho al olvido"):</strong> solicitar la eliminación de tus datos cuando ya no sean necesarios.</li>
            <li><strong>Oposición:</strong> oponerte al tratamiento en ciertos casos.</li>
          </ul>
          <p>
            Para ejercer estos derechos, escribinos a{' '}
            <a href="mailto:privacidad@ventix.com.ar" className="text-emerald-600 hover:underline font-medium">
              privacidad@ventix.com.ar
            </a>{' '}
            indicando tu nombre, email de cuenta y la solicitud. Respondemos en un plazo máximo de 30 días.
          </p>
          <p>
            La Agencia de Acceso a la Información Pública (AAIP) es el órgano de control en Argentina:
            {' '}<a href="https://www.argentina.gob.ar/aaip" target="_blank" rel="noopener noreferrer"
              className="text-emerald-600 hover:underline font-medium">www.argentina.gob.ar/aaip</a>
          </p>
        </Section>

        <Section title="7. Retención de datos">
          <p>
            Conservamos tus datos mientras tu cuenta esté activa. Al cancelar la suscripción, tus datos se mantienen
            por 90 días para permitirte reactivar la cuenta. Transcurrido ese período, se eliminan permanentemente,
            salvo obligación legal de conservación.
          </p>
        </Section>

        <Section title="8. Cookies">
          <p>
            Usamos cookies de sesión estrictamente necesarias para el funcionamiento del sistema de autenticación.
            No usamos cookies de rastreo, publicidad o analytics de terceros.
          </p>
        </Section>

        <Section title="9. Cambios a esta política">
          <p>
            Podemos actualizar esta política ocasionalmente. Cuando lo hagamos, actualizaremos la fecha al inicio
            de este documento y te notificaremos por email si los cambios son relevantes.
          </p>
        </Section>

        <Section title="10. Contacto">
          <p>
            Para cualquier consulta sobre privacidad o protección de datos:{' '}
            <a href="mailto:privacidad@ventix.com.ar" className="text-emerald-600 hover:underline font-medium">
              privacidad@ventix.com.ar
            </a>
          </p>
        </Section>
      </div>
    </div>
  )
}
