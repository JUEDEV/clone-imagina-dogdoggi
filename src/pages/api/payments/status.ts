import type { APIRoute } from 'astro'
import { isOrderReference } from '@/lib/orders/reference'
import { getOrderRepository } from '@/lib/orders/repository'
import { resolveTransaction } from '@/lib/payments/resolve-transaction'
import { findWompiTransactionByReference } from '@/lib/payments/wompi'
import { settleOrder, type SettleOutcome } from '@/lib/payments/settle'

/**
 * Estado del pago de un pedido. Con `id` (transacción) lo verifica contra la
 * pasarela y actualiza la orden; sin `id` busca por referencia si la orden sigue
 * esperando pago; si no, devuelve el estado guardado.
 */
export const prerender = false

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
const outcomeFromStatus = (status: string): SettleOutcome =>
  status === 'paid' || status === 'fulfilled' ? 'approved' : status === 'cancelled' ? 'declined' : 'pending'

export const GET: APIRoute = async ({ url }) => {
  const reference = url.searchParams.get('ref') ?? ''
  const transactionId = url.searchParams.get('id') ?? ''
  if (!isOrderReference(reference)) return json({ error: 'Referencia inválida' }, 400)

  const repo = getOrderRepository()
  const order = repo ? await repo.findByReference(reference) : null
  if (!repo || !order) return json({ error: 'Pedido no encontrado' }, 404)

  const lookupByReference = !transactionId && order.payment.provider === 'wompi' && order.status === 'awaiting_payment'
  if (!transactionId && !lookupByReference) return json({ reference, outcome: outcomeFromStatus(order.status) })

  try {
    const tx = transactionId ? await resolveTransaction(order, transactionId) : await findWompiTransactionByReference(reference)
    if (!tx) return json({ reference, outcome: outcomeFromStatus(order.status) })

    const { outcome, update } = settleOrder(order, tx)
    if (update) await repo.update(reference, update)
    return json({ reference, outcome })
  } catch {
    return json({ reference, outcome: 'pending' satisfies SettleOutcome })
  }
}
