import type { APIRoute } from 'astro'
import { serverEnv } from '@/lib/env'
import { getOrderRepository } from '@/lib/orders/repository'
import { settleOrder } from '@/lib/payments/settle'
import { verifyWompiEvent, type WompiEvent } from '@/lib/payments/wompi'

/**
 * Eventos de Wompi (`transaction.updated`). Configurar en el panel de Wompi:
 *   https://<dominio>/api/payments/wompi/webhook
 * Resuelve pagos que terminan después de que el cliente cerró la ventana (p. ej. PSE pendiente).
 */
export const prerender = false

const json = (body: unknown, status = 200) => Response.json(body, { status })

export const POST: APIRoute = async ({ request }) => {
  const secret = serverEnv('WOMPI_EVENTS_KEY')
  if (!secret) return json({ error: 'Webhook no configurado' }, 503)

  const event = (await request.json().catch(() => null)) as WompiEvent | null
  if (!event || !verifyWompiEvent(event, secret)) return json({ error: 'Firma inválida' }, 401)

  const tx = event.data?.transaction
  if (event.event !== 'transaction.updated' || !tx?.reference) return json({ ok: true })

  const repo = getOrderRepository()
  const order = repo ? await repo.findByReference(tx.reference) : null
  // 200 a referencias desconocidas para que Wompi no reintente.
  if (!repo || !order) return json({ ok: true })

  const { update } = settleOrder(order, tx)
  if (update) await repo.update(order.reference, update)
  return json({ ok: true })
}
