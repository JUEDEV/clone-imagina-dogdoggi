import { strataCreateItem, strataItems, strataUpdateItem } from '@/lib/strata'
import { createOrderReference } from './reference'
import type { NewOrder, Order, OrderLine, OrderRepository, OrderStatus } from './types'

/*
 * Pedidos en el plugin ecommerce de Strata (patrón validado en Kristal Shop):
 * - ecommerce_orders: cabecera; `order_number` = referencia de pago.
 * - ecommerce_order_items: líneas; lo que no tiene columna va en `options`
 *   (Strata no garantiza el orden de lectura: se guarda `position`).
 * - ecommerce_order_transactions: intento de pago (Wompi o simulado).
 * Métodos de pago/envío se enlazan por `code`; si no existen, el enlace queda vacío.
 * Si fallan líneas o transacción, la orden se marca `cancelled` para que no
 * quede "esperando pago" en el panel.
 */

const ORDERS = 'ecommerce_orders'
const ITEMS = 'ecommerce_order_items'
const TRANSACTIONS = 'ecommerce_order_transactions'
const PAYMENT_METHODS = 'ecommerce_payment_methods'
const SHIPMENT_METHODS = 'ecommerce_shipment_methods'

interface RawOrder {
  id: string
  order_number: string
  status: OrderStatus
  customer_email: string
  customer_name: string
  customer_phone: string
  identification_number: string
  subtotal: number | string
  shipping_total: number | string
  total: number | string
  shipping_address: (Order['shipping_address'] & { delivery?: Order['delivery'] }) | null
  billing_address: (Order['contact'] & { delivery?: Order['delivery'] }) | null
  placed_at?: string
  created_at?: string
}

interface RawItem {
  id: string
  product_id: string | null
  title: string
  sku: string | null
  quantity: number
  unit_price: number | string
  subtotal: number | string
  options: { position?: number; slug?: string; image?: string } | null
}

interface RawTransaction {
  id: string
  status: string
  provider_reference: string | null
  data: { provider?: 'wompi' | 'mock'; provider_status?: string | null; method_type?: string | null } | null
}

const num = (value: unknown) => Math.round(Number(value) || 0)

async function methodIdByCode(collection: string, code: string): Promise<string | null> {
  const { data } = await strataItems<{ id: string; code: string; active: boolean | null }>(collection, {
    filter: { code },
    limit: 1,
  }).catch(() => ({ data: [] as { id: string; code: string; active: boolean | null }[] }))
  const method = data.find((m) => m.code === code && m.active !== false)
  return method?.id ?? null
}

const transactionStatus = (providerStatus: string | null) =>
  providerStatus === 'APPROVED' ? 'captured' : providerStatus && ['DECLINED', 'VOIDED', 'ERROR'].includes(providerStatus) ? 'failed' : 'pending'

async function findRaw(reference: string): Promise<RawOrder | null> {
  const { data } = await strataItems<RawOrder>(ORDERS, { filter: { order_number: reference }, limit: 1, lang: 'es' })
  // Re-chequeo: un filtro ignorado devolvería otra orden.
  return data.find((o) => o.order_number === reference) ?? null
}

async function latestTransaction(orderId: string): Promise<RawTransaction | null> {
  const { data } = await strataItems<RawTransaction & { order_id: string }>(TRANSACTIONS, {
    filter: { order_id: orderId },
    sort: '-created_at',
    limit: 1,
    lang: 'es',
  })
  return data.find((t) => t.order_id === orderId) ?? null
}

export const strataOrderRepository: OrderRepository = {
  async create(input: NewOrder) {
    const reference = createOrderReference()
    const [paymentMethodId, shipmentMethodId] = await Promise.all([
      methodIdByCode(PAYMENT_METHODS, input.payment.provider === 'wompi' ? 'wompi' : 'manual'),
      methodIdByCode(SHIPMENT_METHODS, input.delivery.code),
    ])
    const placedAt = new Date().toISOString()

    const order = await strataCreateItem<RawOrder>(ORDERS, {
      order_number: reference,
      status: 'awaiting_payment',
      customer_email: input.contact.email,
      customer_name: `${input.contact.first_name} ${input.contact.last_name}`,
      customer_phone: input.contact.phone,
      identification_type: 'CC',
      identification_number: input.contact.identification_number,
      currency: 'COP',
      subtotal: input.subtotal,
      shipping_total: input.shipping_total,
      tax_total: 0,
      payment_fee_total: 0,
      total: input.total,
      payment_method_id: paymentMethodId,
      shipment_method_id: shipmentMethodId,
      tax_mode: 'declare_external',
      shipping_address: input.shipping_address ? { ...input.shipping_address, delivery: input.delivery } : null,
      billing_address: { ...input.contact, identification_type: 'CC', delivery: input.delivery },
      placed_at: placedAt,
    })

    try {
      // Secuencial: `order_id` es obligatorio y Strata responde OK aunque no guarde.
      for (const [position, line] of input.items.entries()) {
        await strataCreateItem(ITEMS, {
          order_id: order.id,
          product_id: line.product_id,
          title: line.name,
          sku: line.sku ?? null,
          quantity: line.quantity,
          unit_price: line.unit_price,
          subtotal: line.subtotal,
          options: { position, slug: line.slug, image: line.image },
        })
      }
      await strataCreateItem(TRANSACTIONS, {
        order_id: order.id,
        payment_method_id: paymentMethodId,
        status: 'pending',
        amount: input.total,
        currency: 'COP',
        provider_reference: null,
        data: { provider: input.payment.provider, provider_status: null, method_type: null },
      })
    } catch (error) {
      await strataUpdateItem(ORDERS, order.id, { status: 'cancelled' }).catch(() => {})
      throw error
    }

    return { ...input, reference, status: 'awaiting_payment', created_at: placedAt }
  },

  async findByReference(reference) {
    const raw = await findRaw(reference)
    if (!raw) return null
    const [{ data: rawItems }, tx] = await Promise.all([
      strataItems<RawItem & { order_id: string }>(ITEMS, { filter: { order_id: raw.id }, limit: 50, lang: 'es' }),
      latestTransaction(raw.id),
    ])
    const items: OrderLine[] = rawItems
      .filter((item) => item.order_id === raw.id)
      .sort((a, b) => (a.options?.position ?? 0) - (b.options?.position ?? 0))
      .map((item) => ({
        product_id: item.product_id ?? '',
        slug: item.options?.slug ?? '',
        name: item.title,
        image: item.options?.image ?? '',
        sku: item.sku ?? undefined,
        unit_price: num(item.unit_price),
        quantity: item.quantity,
        subtotal: num(item.subtotal),
      }))
    const billing = raw.billing_address
    const delivery = raw.shipping_address?.delivery ?? billing?.delivery ?? { code: '', label: '', pickup: !raw.shipping_address }
    const { delivery: _omit, ...shippingAddress } = raw.shipping_address ?? ({} as NonNullable<RawOrder['shipping_address']>)
    return {
      reference: raw.order_number,
      status: raw.status,
      created_at: raw.placed_at ?? raw.created_at ?? '',
      contact: {
        first_name: billing?.first_name ?? raw.customer_name,
        last_name: billing?.last_name ?? '',
        email: raw.customer_email,
        phone: raw.customer_phone,
        identification_number: raw.identification_number,
      },
      delivery,
      shipping_address: raw.shipping_address ? (shippingAddress as Order['shipping_address']) : null,
      items,
      subtotal: num(raw.subtotal),
      shipping_total: num(raw.shipping_total),
      total: num(raw.total),
      payment: {
        provider: tx?.data?.provider ?? 'wompi',
        transaction_id: tx?.provider_reference ?? null,
        provider_status: tx?.data?.provider_status ?? null,
        method_type: tx?.data?.method_type ?? null,
      },
    }
  },

  async update(reference, { status, payment }) {
    const raw = await findRaw(reference)
    if (!raw) return
    await strataUpdateItem(ORDERS, raw.id, { status })

    const tx = await latestTransaction(raw.id)
    const body = {
      status: transactionStatus(payment.provider_status),
      provider_reference: payment.transaction_id,
      data: { provider: payment.provider, provider_status: payment.provider_status, method_type: payment.method_type },
    }
    // Misma transacción (o la inicial sin referencia): se actualiza; otra distinta: se crea.
    if (tx && (!tx.provider_reference || tx.provider_reference === payment.transaction_id)) {
      await strataUpdateItem(TRANSACTIONS, tx.id, body)
    } else {
      await strataCreateItem(TRANSACTIONS, { order_id: raw.id, amount: num(raw.total), currency: 'COP', ...body })
    }
  },
}
