import type { Order, OrderStatus } from '@/lib/orders/types'
import { CURRENCY, toCents, type WompiTransaction } from './wompi'

export type SettleOutcome = 'approved' | 'declined' | 'pending' | 'mismatch'

export function mapTransactionStatus(status: string): { outcome: Exclude<SettleOutcome, 'mismatch'>; orderStatus: OrderStatus } {
  if (status === 'APPROVED') return { outcome: 'approved', orderStatus: 'paid' }
  if (status === 'DECLINED' || status === 'VOIDED' || status === 'ERROR') return { outcome: 'declined', orderStatus: 'cancelled' }
  return { outcome: 'pending', orderStatus: 'awaiting_payment' }
}

/**
 * Decide qué hacer con la orden dada una transacción. Pura: no persiste.
 * - Referencia, monto y moneda deben coincidir; si no, `mismatch` (revisión manual, no se marca pagada).
 * - Una orden pagada nunca se degrada por un evento tardío.
 */
export function settleOrder(order: Order, tx: WompiTransaction): { outcome: SettleOutcome; update: Pick<Order, 'status' | 'payment'> | null } {
  if (tx.reference !== order.reference || tx.amount_in_cents !== toCents(order.total) || tx.currency !== CURRENCY) {
    return { outcome: 'mismatch', update: null }
  }

  const { outcome, orderStatus } = mapTransactionStatus(tx.status)
  if (order.status === 'paid' && outcome !== 'approved') return { outcome: 'approved', update: null }

  return {
    outcome,
    update: {
      status: orderStatus,
      payment: {
        ...order.payment,
        transaction_id: tx.id,
        provider_status: tx.status,
        method_type: tx.payment_method_type ?? null,
      },
    },
  }
}
