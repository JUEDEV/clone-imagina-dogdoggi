import type { APIRoute } from 'astro'
import { getCatalog } from '@/lib/catalog'
import { serverEnv } from '@/lib/env'
import { validateCheckoutForm } from '@/lib/checkout/form'
import { MIN_ONLINE_TOTAL, quoteItems } from '@/lib/checkout/quote'
import { getShippingOptions } from '@/lib/checkout/shipping'
import { getOrderRepository } from '@/lib/orders/repository'
import { buildWompiCheckoutUrl, getPaymentMode, isPublicRedirectUrl, toCents } from '@/lib/payments/wompi'

/**
 * Crea el pedido (pendiente de pago) y devuelve a dónde redirigir para pagar.
 * Precios y stock se recalculan aquí desde el catálogo; del navegador solo
 * llegan ids, cantidades y los datos del formulario.
 */
export const prerender = false

const json = (body: unknown, status = 200) => Response.json(body, { status })

export const POST: APIRoute = async ({ request, url }) => {
  const mode = getPaymentMode()
  const repo = getOrderRepository()
  if (mode === 'disabled' || !repo) return json({ error: 'Los pagos en línea no están disponibles en este momento.' }, 503)

  const body = (await request.json().catch(() => ({}))) as { items?: unknown; form?: unknown }
  const [catalog, shippingOptions] = await Promise.all([getCatalog(), getShippingOptions()])

  const form = validateCheckoutForm(body.form, shippingOptions)
  if (!form.ok) return json({ error: 'Revisa los datos del formulario.', errors: form.errors }, 422)

  const quote = quoteItems(catalog, body.items)
  if (!quote.ok) return json({ error: quote.error }, 409)

  const shippingTotal = form.delivery.price
  const total = quote.subtotal + shippingTotal
  if (total < MIN_ONLINE_TOTAL) return json({ error: 'El valor mínimo para pagar en línea es $1.500.' }, 409)

  try {
    const order = await repo.create({
      contact: form.contact,
      delivery: { code: form.delivery.code, label: form.delivery.label, pickup: form.delivery.pickup },
      shipping_address: form.address,
      items: quote.lines,
      subtotal: quote.subtotal,
      shipping_total: shippingTotal,
      total,
      payment: { provider: mode === 'wompi' ? 'wompi' : 'mock', transaction_id: null, provider_status: null, method_type: null },
    })

    const returnPath = `/pago/retorno?ref=${encodeURIComponent(order.reference)}`
    const returnUrl = `${url.origin}${returnPath}`
    // Wompi rechaza (403) volver a localhost/IPs: en local se paga en otra pestaña y el retorno consulta por referencia.
    const canReturn = isPublicRedirectUrl(returnUrl)
    const { contact } = form

    const redirect_url =
      mode === 'wompi'
        ? buildWompiCheckoutUrl(
            {
              reference: order.reference,
              amountInCents: toCents(order.total),
              redirectUrl: canReturn ? returnUrl : undefined,
              customer: {
                email: contact.email,
                fullName: `${contact.first_name} ${contact.last_name}`,
                phone: contact.phone,
                legalId: contact.identification_number,
              },
            },
            serverEnv('WOMPI_PUBLIC_KEY') as string,
            serverEnv('WOMPI_INTEGRITY_KEY') as string,
          )
        : `/pago/prueba?ref=${encodeURIComponent(order.reference)}`

    const status_url = mode === 'wompi' && !canReturn ? returnPath : undefined
    return json({ ok: true, reference: order.reference, total: order.total, redirect_url, status_url })
  } catch (error) {
    console.error('[checkout] no se pudo crear el pedido', error instanceof Error ? error.message : error)
    return json({ error: 'No pudimos crear tu pedido en este momento. Intenta de nuevo o escríbenos por WhatsApp.' }, 500)
  }
}
