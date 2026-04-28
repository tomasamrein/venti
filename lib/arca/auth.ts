import forge from 'node-forge'
import type { ArcaSettings, ArcaToken } from '@/types/arca'

const WSAA_HOMO = 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms'
const WSAA_PROD = 'https://wsaa.afip.gov.ar/ws/services/LoginCms'

/**
 * Builds a TRA (Ticket de Requerimiento de Acceso) XML.
 * Service is WSFE for electronic invoicing.
 *
 * AFIP requires:
 * - generationTime: a few minutes in the past (clock skew tolerance)
 * - expirationTime: max 12h after generationTime
 * - uniqueId: monotonically increasing (we use unix seconds)
 */
function buildTRA(): string {
  const now = new Date()
  const gen = new Date(now.getTime() - 5 * 60 * 1000)
  const exp = new Date(now.getTime() + 11 * 60 * 60 * 1000) // 11h to be safe

  // ARCA expects ISO 8601 with -03:00 offset (no milliseconds)
  const fmt = (d: Date) => d.toISOString().slice(0, 19) + '-03:00'

  return `<?xml version="1.0" encoding="UTF-8"?>
<loginTicketRequest version="1.0">
  <header>
    <uniqueId>${Math.floor(now.getTime() / 1000)}</uniqueId>
    <generationTime>${fmt(gen)}</generationTime>
    <expirationTime>${fmt(exp)}</expirationTime>
  </header>
  <service>wsfe</service>
</loginTicketRequest>`
}

function signTRA(traXml: string, certPem: string, keyPem: string): string {
  const cert = forge.pki.certificateFromPem(certPem)
  const key = forge.pki.privateKeyFromPem(keyPem)

  const p7 = forge.pkcs7.createSignedData()
  p7.content = forge.util.createBuffer(traXml, 'utf8')
  p7.addCertificate(cert)
  p7.addSigner({
    key,
    certificate: cert,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
      { type: forge.pki.oids.messageDigest },
      // signingTime — node-forge typings expect string, but runtime accepts Date.
      // Use UTCTime format that node-forge handles.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { type: forge.pki.oids.signingTime, value: new Date() as any },
    ],
  })
  p7.sign()

  return forge.util.encode64(forge.asn1.toDer(p7.toAsn1()).getBytes())
}

interface WsaaError {
  code?: string
  message: string
  raw: string
}

function parseWsaaFault(xml: string): WsaaError | null {
  // SOAP fault path
  const faultMatch = xml.match(/<faultstring[^>]*>([\s\S]*?)<\/faultstring>/i)
  if (faultMatch) {
    const message = faultMatch[1].trim()
    const codeMatch = xml.match(/<faultcode[^>]*>([\s\S]*?)<\/faultcode>/i)
    return { code: codeMatch?.[1]?.trim(), message, raw: xml.slice(0, 500) }
  }
  return null
}

async function callWSAA(cms: string, env: ArcaSettings['environment']): Promise<ArcaToken> {
  const url = env === 'production' ? WSAA_PROD : WSAA_HOMO

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsaa="http://wsaa.view.sua.dvadac.desein.afip.gov.ar">
  <soapenv:Header/>
  <soapenv:Body>
    <wsaa:loginCms>
      <wsaa:in0>${cms}</wsaa:in0>
    </wsaa:loginCms>
  </soapenv:Body>
</soapenv:Envelope>`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: 'loginCms' },
    body,
  })

  const xml = await res.text()

  if (!res.ok) {
    const fault = parseWsaaFault(xml)
    throw new Error(`WSAA HTTP ${res.status}: ${fault?.message ?? xml.slice(0, 300)}`)
  }

  const fault = parseWsaaFault(xml)
  if (fault) {
    // Common: "El CEE ya posee un TA valido" — token already issued, must wait
    throw new Error(`WSAA: ${fault.message}`)
  }

  // The login response is XML-escaped XML inside <loginCmsReturn>
  const innerMatch = xml.match(/<loginCmsReturn>([\s\S]*?)<\/loginCmsReturn>/)
  const inner = innerMatch
    ? innerMatch[1]
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
    : xml

  const token = inner.match(/<token>([\s\S]*?)<\/token>/)?.[1]?.trim()
  const sign = inner.match(/<sign>([\s\S]*?)<\/sign>/)?.[1]?.trim()
  const expMatch = inner.match(/<expirationTime>([\s\S]*?)<\/expirationTime>/)?.[1]?.trim()

  if (!token || !sign) {
    throw new Error(`WSAA respuesta inválida: ${xml.slice(0, 400)}`)
  }

  return {
    token,
    sign,
    expires_at: expMatch ?? new Date(Date.now() + 11 * 3600 * 1000).toISOString(),
  }
}

/**
 * Returns a valid ARCA token, using the cache when possible.
 * If the token is refreshed, returns updatedSettings with the new cache.
 *
 * Buffer of 5 minutes before expiration to avoid using a token that expires mid-request.
 */
export async function getArcaToken(
  settings: ArcaSettings
): Promise<{ token: ArcaToken; updatedSettings: ArcaSettings }> {
  if (settings.token_cache) {
    const expiresAt = new Date(settings.token_cache.expires_at)
    if (expiresAt > new Date(Date.now() + 5 * 60 * 1000)) {
      return {
        token: {
          token: settings.token_cache.token,
          sign: settings.token_cache.sign,
          expires_at: settings.token_cache.expires_at,
        },
        updatedSettings: settings,
      }
    }
  }

  const tra = buildTRA()
  const cms = signTRA(tra, settings.cert_pem, settings.key_pem)
  const token = await callWSAA(cms, settings.environment)

  return {
    token,
    updatedSettings: {
      ...settings,
      token_cache: { ...token, generated_at: new Date().toISOString() },
    },
  }
}

/**
 * Extract cert + key PEM from a PKCS#12 (.p12) buffer.
 * Tries pkcs8ShroudedKeyBag first, falls back to keyBag (plain).
 */
export function extractPemsFromP12(
  p12Base64: string,
  password: string
): { certPem: string; keyPem: string } {
  let p12Asn1: forge.asn1.Asn1
  try {
    p12Asn1 = forge.asn1.fromDer(forge.util.decode64(p12Base64))
  } catch {
    throw new Error('Archivo .p12 inválido o corrupto')
  }

  let p12: forge.pkcs12.Pkcs12Pfx
  try {
    p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password)
  } catch {
    throw new Error('Contraseña del certificado incorrecta')
  }

  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })
  const cert = certBags[forge.pki.oids.certBag]?.[0]?.cert
  if (!cert) throw new Error('No se encontró el certificado en el archivo .p12')

  const shroudedBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })
  const plainBags = p12.getBags({ bagType: forge.pki.oids.keyBag })
  const key =
    shroudedBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0]?.key ??
    plainBags[forge.pki.oids.keyBag]?.[0]?.key
  if (!key) throw new Error('No se encontró la clave privada en el archivo .p12')

  // Validate cert hasn't expired
  if (cert.validity.notAfter < new Date()) {
    throw new Error(`El certificado expiró el ${cert.validity.notAfter.toLocaleDateString('es-AR')}`)
  }

  return {
    certPem: forge.pki.certificateToPem(cert),
    keyPem: forge.pki.privateKeyToPem(key),
  }
}
