import type { WompiTransaction } from './wompi'

/* Pago simulado (solo desarrollo): /pago/prueba redirige al retorno con un id
   `mock_<ESTADO>_<referencia>` que imita una transacción de Wompi. */

export const MOCK_STATUSES = ['APPROVED', 'DECLINED', 'PENDING'] as const
export type MockStatus = (typeof MOCK_STATUSES)[number]

export const buildMockTransactionId = (status: MockStatus, reference: string) => `mock_${status}_${reference}`

export function parseMockTransaction(id: string, amountInCents: number): WompiTransaction | null {
  const match = /^mock_(APPROVED|DECLINED|PENDING)_(.+)$/.exec(id)
  if (!match) return null
  return {
    id,
    status: match[1],
    reference: match[2],
    amount_in_cents: amountInCents,
    currency: 'COP',
    payment_method_type: 'MOCK',
  }
}
