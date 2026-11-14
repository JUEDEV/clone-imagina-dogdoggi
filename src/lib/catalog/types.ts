// Tipos del catálogo, independientes de la fuente (Strata o muestra).
// Los componentes solo conocen estos tipos; cambiar de fuente no los toca.

export type ProductBadge = 'nuevo' | 'oferta' | 'mas_vendido'

export interface Category {
  id: string
  slug: string
  name: string
  description?: string
  parentId: string | null
  image?: string
  sort: number
}

export interface Product {
  id: string
  slug: string
  sku?: string
  name: string
  /** HTML (rich text del CMS). */
  description?: string
  /** Precio de venta en pesos (COP, enteros). */
  price: number
  /** Precio antes del descuento; solo si es mayor que `price`. */
  compareAtPrice?: number
  image: string
  images: string[]
  categoryId: string | null
  brand?: string
  badge?: ProductBadge
  featured: boolean
  /** Unidades disponibles; `null` = no se controla inventario. */
  stock: number | null
  createdAt: string
  sort: number
  metaTitle?: string
  metaDescription?: string
}

export interface Catalog {
  categories: Category[]
  products: Product[]
  /** `sample` mientras no haya Strata configurado. */
  source: 'strata' | 'sample'
}
