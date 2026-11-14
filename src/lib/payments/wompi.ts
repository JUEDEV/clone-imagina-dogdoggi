import { createHash, timingSafeEqual } from 'node:crypto'
import { serverEnv } from '@/lib/env'

/* Wompi · Web Checkout por redirección (PSE, tarjetas débito/crédito).
   Sin llaves y fuera de producción se usa el modo simulado (/pago/prueba). */

export type PaymentMode = 'wompi' | 'mock' | 'disabled'

export const WOMPI_CHECKOUT_URL = 'https://checkout.wompi.co/p/'
export const CURRENCY = 'COP'

export interface WompiTransaction {
  id: string
  status: 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR' | 'PENDING' | string
  reference: string
  amount_in_cents: number
  currency: string
  payment_method_type?: string | null
}

export function getPaymentMode(): PaymentMode {
  if (serverEnv('WOMPI_PUBLIC_KEY') && serverEnv('WOMPI_INTEGRITY_KEY')) return 'wompi'
  return import.meta.env.PROD ? 'disabled' : 'mock'
}

/** Base de la API con `/v1`. `WOMPI_URL` puede venir con o sin `/v1`. */
export function getWompiApiUrl(): string {
  const base = serverEnv('WOMPI_URL')?.replace(/\/+$/, '')
  if (base) return base.endsWith('/v1') ? base : `${base}/v1`
  return serverEnv('WOMPI_PUBLIC_KEY')?.startsWith('pub_prod_') ? 'https://production.wompi.co/v1' : 'https://sandbox.wompi.co/v1'
}

export const toCents = (pesos: number) => Math.round(pesos * 100)

/** Firma de integridad: SHA256(referencia + monto_en_centavos + moneda + secreto). */
export function integritySignature(reference: string, amountInCents: number, secret: string, currency = CURRENCY): string {
  return createHash('sha256').update(`${reference}${amountInCents}${currency}${secret}`).digest('hex')
}

interface CheckoutUrlInput {
  reference: string
  amountInCents: number
  /** Omitir si el sitio no tiene dominio público: Wompi rechaza (403) localhost e IPs */
  redirectUrl?: string
  customer: { email: string; fullName: string; phone: string; legalId: string }
}

/** Wompi solo acepta `redirect-url` hacia un dominio público (no localhost, IPs ni .local). */
export function isPublicRedirectUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url)
    return !(hostname === 'localhost' || hostname.endsWith('.local') || /^[\d.]+$/.test(hostname) || hostname.includes(':'))
  } catch {
    return false
  }
}

export function buildWompiCheckoutUrl(
  { reference, amountInCents, redirectUrl, customer }: CheckoutUrlInput,
  publicKey: string,
  integritySecret: string,
): string {
  const params = new URLSearchParams({
    'public-key': publicKey,
    currency: CURRENCY,
    'amount-in-cents': String(amountInCents),
    reference,
    'signature:integrity': integritySignature(reference, amountInCents, integritySecret),
    'customer-data:email': customer.email,
    'customer-data:full-name': customer.fullName,
    'customer-data:phone-number': customer.phone,
    'customer-data:phone-number-prefix': '+57',
    'customer-data:legal-id': customer.legalId,
    'customer-data:legal-id-type': 'CC',
  })
  if (redirectUrl) params.set('redirect-url', redirectUrl)
  return `${WOMPI_CHECKOUT_URL}?${params.toString()}`
}

/** Consulta pública de la transacción (no requiere llave privada). */
export async function fetchWompiTransaction(id: string): Promise<WompiTransaction | null> {
  const response = await fetch(`${getWompiApiUrl()}/transactions/${encodeURIComponent(id)}`)
  if (!response.ok) return null
  const payload = (await response.json().catch(() => null)) as { data?: WompiTransaction } | null
  return payload?.data ?? null
}

/**
 * Última transacción de una referencia (requiere llave privada). Sirve cuando no llega el `id`:
 * el cliente cerró la pestaña antes de volver, o el sitio corre sin dominio público.
 */
export async function findWompiTransactionByReference(reference: string): Promise<WompiTransaction | null> {
  const privateKey = serverEnv('WOMPI_PRIVATE_KEY')
  if (!privateKey) return null
  const response = await fetch(`${getWompiApiUrl()}/transactions?reference=${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${privateKey}` },
  })
  if (!response.ok) return null
  const payload = (await response.json().catch(() => null)) as { data?: WompiTransaction[] } | null
  const transactions = payload?.data ?? []
  // Una aprobada gana sobre intentos rechazados previos con la misma referencia
  return transactions.find((t) => t.status === 'APPROVED') ?? transactions[0] ?? null
}

/* --- Webhook de eventos --- */

export interface WompiEvent {
  event: string
  data: { transaction?: WompiTransaction } & Record<string, unknown>
  signature: { properties: string[]; checksum: string }
  timestamp: number
}

const getPath = (source: unknown, path: string) =>
  path.split('.').reduce<unknown>((acc, key) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[key] : undefined), source)

/** checksum = SHA256(valores de `signature.properties` sobre `data` + timestamp + secreto de eventos). */
export function verifyWompiEvent(event: WompiEvent, eventsSecret: string): boolean {
  const properties = event?.signature?.properties
  const checksum = event?.signature?.checksum
  if (!Array.isArray(properties) || typeof checksum !== 'string') return false

  const values = properties.map((p) => String(getPath(event.data, p) ?? '')).join('')
  const expected = createHash('sha256').update(`${values}${event.timestamp}${eventsSecret}`).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(checksum.toLowerCase())
  return a.length === b.length && timingSafeEqual(a, b)
}
