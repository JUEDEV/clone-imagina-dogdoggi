import type { Order } from '@/lib/orders/types'
import { parseMockTransaction } from './mock'
import { fetchWompiTransaction, getPaymentMode, toCents, type WompiTransaction } from './wompi'

/** Obtiene la transacción desde Wompi (o la simulada) para una orden. */
export async function resolveTransaction(order: Order, transactionId: string): Promise<WompiTransaction | null> {
  if (order.payment.provider === 'mock') {
    return getPaymentMode() === 'mock' ? parseMockTransaction(transactionId, toCents(order.total)) : null
  }
  return fetchWompiTransaction(transactionId)
}
