/**
 * Catálogo de muestra de la plantilla. Alimenta las vitrinas del home y el
 * endpoint /api/search. Se reemplaza por el ecommerce de Strata al conectar el CMS.
 */

export type ProductKind = 'cosmetica' | 'herramientas'

export interface Product {
  id: number
  slug: string
  name: string
  category: string
  price: number
  oldPrice?: number
  image: string
  tag?: 'Perfect Groom' | 'Oferta' | 'Nuevo'
  kind: ProductKind
}

export const PRODUCTS: Product[] = [
  { id: 1, slug: 'shampoo-alisante-natural-2000', name: 'Shampoo alisante natural 2000 ml', category: 'Perfect Groom', price: 68900, image: '/images/products/perfect-groom-shampoo.jpeg', tag: 'Perfect Groom', kind: 'cosmetica' },
  { id: 2, slug: 'tijera-curva-profesional-7-5', name: 'Tijera curva profesional 7.5”', category: 'Tijeras', price: 189000, oldPrice: 219000, image: '/images/products/tijera-curva.png', tag: 'Oferta', kind: 'herramientas' },
  { id: 3, slug: 'kit-tijeras-peine-metalico', name: 'Kit de tijeras y peine metálico', category: 'Tijeras', price: 249900, image: '/images/products/kit-tijeras.png', tag: 'Nuevo', kind: 'herramientas' },
  { id: 4, slug: 'set-esencial-cepilleria', name: 'Set esencial de cepillería', category: 'Cepillería', price: 159900, oldPrice: 189900, image: '/images/products/set-cepilleria.png', tag: 'Oferta', kind: 'herramientas' },
  { id: 5, slug: 'shampoo-limpieza-profunda-2000', name: 'Shampoo limpieza profunda 2000 ml', category: 'Perfect Groom', price: 64900, image: '/images/products/perfect-groom-shampoo.jpeg', tag: 'Perfect Groom', kind: 'cosmetica' },
  { id: 6, slug: 'herramientas-acabado-profesional', name: 'Herramientas para acabado profesional', category: 'Accesorios', price: 119000, image: '/images/products/herramientas-acabado.png', kind: 'herramientas' },
  { id: 7, slug: 'shampoo-cuidado-pelaje', name: 'Shampoo para cuidado del pelaje', category: 'Cosmética', price: 42900, oldPrice: 49900, image: '/images/products/shampoo-pelaje.png', tag: 'Oferta', kind: 'cosmetica' },
  { id: 8, slug: 'espuma-limpieza-sin-enjuague', name: 'Espuma de limpieza sin enjuague', category: 'Cosmética', price: 38900, oldPrice: 45900, image: '/images/products/espuma-sin-enjuague.png', tag: 'Oferta', kind: 'cosmetica' },
]

export const money = (value: number) => `$${value.toLocaleString('es-CO')}`

export const discountOf = (product: Pick<Product, 'price' | 'oldPrice'>) =>
  product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0

// TODO: apuntar a /tienda/[slug] cuando exista la ficha de producto (CMS).
export const productHref = (_product: Pick<Product, 'slug'>) => '/#destacados'

export const COSMETICS = PRODUCTS.filter((p) => p.kind === 'cosmetica')
export const OFFERS = PRODUCTS.filter((p) => p.oldPrice)

/** Búsqueda simple por nombre y categoría: todos los términos deben aparecer. */
export const searchProducts = (query: string, limit = 6) => {
  const terms = query.toLocaleLowerCase('es').split(/\s+/).filter(Boolean)
  if (!terms.length) return []
  return PRODUCTS.filter((product) => {
    const haystack = `${product.name} ${product.category}`.toLocaleLowerCase('es')
    return terms.every((term) => haystack.includes(term))
  }).slice(0, limit)
}
