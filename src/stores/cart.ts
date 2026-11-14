import { atom, computed } from 'nanostores'
import { persistentJSON } from '@nanostores/persistent'
import type { CartItem, CartProduct } from '@/lib/cart/types'

/*
 * Carrito del navegador (como Herbolario y Kristal Shop): localStorage +
 * nanostores, compartido entre islas sin contexto de React. No hay carrito en
 * Strata hasta el checkout, que recalcula todo en el servidor.
 */

export const $cartItems = persistentJSON<CartItem[]>('dogdoggi-cart', [])
export const $isCartOpen = atom(false)

export const $totalItems = computed($cartItems, (items) => items.reduce((sum, item) => sum + item.quantity, 0))
export const $subtotal = computed($cartItems, (items) => items.reduce((sum, item) => sum + item.price * item.quantity, 0))

export const MAX_PER_LINE = 99

const limitOf = (item: Pick<CartItem, 'maxQuantity'>) => Math.min(MAX_PER_LINE, item.maxQuantity ?? MAX_PER_LINE)

export interface AddResult {
  added: boolean
  quantity: number
  reason?: string
}

export function addToCart(product: CartProduct, quantity = 1): AddResult {
  const items = $cartItems.get()
  const existing = items.find((item) => item.id === product.id)
  const limit = limitOf(product)
  if (limit <= 0) return { added: false, quantity: 0, reason: 'Producto agotado' }

  const current = existing?.quantity ?? 0
  const next = Math.min(limit, current + Math.max(1, quantity))
  if (next === current) return { added: false, quantity: current, reason: 'No hay más unidades disponibles' }

  // Se refrescan precio, nombre y stock con lo último que pintó la página.
  const line: CartItem = { ...product, quantity: next }
  $cartItems.set(existing ? items.map((item) => (item.id === product.id ? line : item)) : [...items, line])
  return { added: true, quantity: next }
}

export function updateQuantity(id: string, quantity: number) {
  $cartItems.set(
    $cartItems.get().map((item) => (item.id === id ? { ...item, quantity: Math.max(1, Math.min(limitOf(item), quantity)) } : item)),
  )
}

export const removeFromCart = (id: string) => $cartItems.set($cartItems.get().filter((item) => item.id !== id))
export const clearCart = () => $cartItems.set([])
export const isAtLimit = (item: CartItem) => item.quantity >= limitOf(item)

export const openCart = () => $isCartOpen.set(true)
export const closeCart = () => $isCartOpen.set(false)
