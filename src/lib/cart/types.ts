import type { Product } from '@/lib/catalog/types'

/**
 * Línea del carrito (vive en localStorage). Precio y nombre son solo para
 * pintar: el servidor los recalcula desde el catálogo al hacer checkout.
 */
export interface CartItem {
  id: string
  slug: string
  name: string
  image: string
  price: number
  quantity: number
  /** Tope por stock; `null` = sin control de inventario. */
  maxQuantity: number | null
}

/** Lo que una tarjeta o la ficha le pasan a las islas para agregar al carrito. */
export type CartProduct = Omit<CartItem, 'quantity'>

export const toCartProduct = (product: Product): CartProduct => ({
  id: product.id,
  slug: product.slug,
  name: product.name,
  image: product.image,
  price: product.price,
  maxQuantity: product.stock,
})
