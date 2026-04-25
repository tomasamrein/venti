import forge from 'node-forge'
import type { ArcaSettings, ArcaToken } from '@/types/arca'

const WSAA_HOMO = 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms'
const WSAA_PROD = 'https://wsaa.afip.gov.ar/ws/services/LoginCms'

function buildTRA(): string {
  const now = new Date()
  const gen = new Date(now.getTime() - 5 * 60 * 1000)
  const exp = new Date(now.getTime() + 12 * 60 * 60 * 1000)

  // AFIP expects ISO 8601 with AR timezone offset
  const fmt = (d: Date) => {
    const s = d.toISOString().slice(0, 19)
    return `${s}-03:00`
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n<loginTicketRequest version="1.0">\n  <header>\n    <uniqueId>${Math.floor(now.getTime() / 1000)}</uniqueId>\n    <generationTime>${fmt(gen)}</generationTime>\n    <expirationTime>${fmt(exp)}</expirationTime>\n  </header>\n  <service>wsfe</service>\n</loginTicketRequest>`
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
      { type: forge.pki.oids.signingTime, value: new Date().toISOString() },
    ],
  })
  p7.sign()

  return forge.util.encode64(forge.asn1.toDer(p7.toAsn1()).getBytes())
}

async function callWSAA(cms: string, env: ArcaSettings['environment']): Promise<ArcaToken> {
  const url = env === 'production' ? WSAA_PROD : WSAA_HOMO

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsaa="http://wsaa.view.sua.dvadac.desein.afip.gov.ar">\n  <soapenv:Header/>\n  <soapenv:Body>\n    <wsaa:loginCms>\n      <wsaa:in0>${cms}</wsaa:in0>\n    </wsaa:loginCms>\n  </soapenv:Body>\n</soapenv:Envelope>`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': 'loginCms' },
    body,
  })

  if (!res.ok) throw new Error(`WSAA HTTP ${res.status}`)

  const xml = await res.text()

  const token = xml.match(/<token>([\s\S]*?)<\/token>/)?.[1]?.trim()
  const sign = xml.match(/<sign>([\s\S]*?)<\/sign>/)?.[1]?.trim()
  const expMatch = xml.match(/<expirationTime>([\s\S]*?)<\/expirationTime>/)?.[1]?.trim()

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
 */
export async function getArcaToken(
  settings: ArcaSettings
): Promise<{ token: ArcaToken; updatedSettings: ArcaSettings }> {
  // Use cached token if still valid (with 5-min buffer)
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

  const updatedSettings: ArcaSettings = {
    ...settings,
    token_cache: { ...token, generated_at: new Date().toISOString() },
  }

  return { token, updatedSettings }
}

/**
 * Extract cert + key PEM from a PKCS#12 (.p12) buffer.
 */
export function extractPemsFromP12(
  p12Base64: string,
  password: string
): { certPem: string; keyPem: string } {
  const p12Asn1 = forge.asn1.fromDer(forge.util.decode64(p12Base64))
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password)

  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })
  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })

  const cert = certBags[forge.pki.oids.certBag]?.[0]?.cert
  const key = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0]?.key

  if (!cert || !key) throw new Error('No se encontró certificado o clave en el archivo .p12')

  return {
    certPem: forge.pki.certificateToPem(cert),
    keyPem: forge.pki.privateKeyToPem(key),
  }
}
