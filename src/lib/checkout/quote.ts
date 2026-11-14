import { findProductById, type Catalog } from '@/lib/catalog'
import type { OrderLine } from '@/lib/orders/types'

/*
 * Recalcula el pedido desde el catálogo: del navegador solo se aceptan ids y
 * cantidades; precio, nombre y stock salen del servidor.
 */

const MAX_LINES = 50
const MAX_QUANTITY = 99
/** Wompi no acepta pagos menores a $1.500. */
export const MIN_ONLINE_TOTAL = 1500

export type QuoteResult = { ok: true; lines: OrderLine[]; subtotal: number } | { ok: false; error: string }

export function quoteItems(catalog: Catalog, rawItems: unknown): QuoteResult {
  if (!Array.isArray(rawItems) || rawItems.length === 0) return { ok: false, error: 'Tu carrito está vacío.' }
  if (rawItems.length > MAX_LINES) return { ok: false, error: 'El pedido tiene demasiados productos.' }

  const lines: OrderLine[] = []
  for (const raw of rawItems) {
    const id = String((raw as { id?: unknown })?.id ?? '')
    const quantity = Math.floor(Number((raw as { quantity?: unknown })?.quantity))
    if (!id || !Number.isFinite(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      return { ok: false, error: 'Revisa las cantidades de tu carrito.' }
    }
    const product = findProductById(catalog, id)
    if (!product) return { ok: false, error: 'Uno de los productos de tu carrito ya no está disponible.' }
    if (product.stock !== null && product.stock <= 0) return { ok: false, error: `${product.name} está agotado.` }
    if (product.stock !== null && quantity > product.stock) {
      return { ok: false, error: `Solo hay ${product.stock} ${product.stock === 1 ? 'unidad disponible' : 'unidades disponibles'} de ${product.name}.` }
    }
    if (lines.some((line) => line.product_id === id)) return { ok: false, error: 'El carrito tiene productos repetidos.' }
    lines.push({
      product_id: product.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      sku: product.sku,
      unit_price: product.price,
      quantity,
      subtotal: product.price * quantity,
    })
  }
  return { ok: true, lines, subtotal: lines.reduce((sum, line) => sum + line.subtotal, 0) }
}
