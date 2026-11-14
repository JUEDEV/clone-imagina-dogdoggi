import { strataAllItems, strataFileUrl } from '@/lib/strata'
import type { Catalog, Category, Product, ProductBadge } from './types'

/*
 * Lectura del catálogo desde el plugin ecommerce de Strata.
 *
 * Colecciones nativas: `ecommerce_product_categories` y `ecommerce_products`.
 * Campos propios que hay que agregar a `ecommerce_products` (no los trae el plugin):
 *   compare_at_price (decimal), brand (string), badge (nuevo|oferta|mas_vendido),
 *   is_featured (boolean), sort (integer), gallery (archivos), meta_title, meta_description.
 * Strata no aplica valores por defecto ni expande relaciones: todo se normaliza aquí.
 */

const CATEGORIES = 'ecommerce_product_categories'
const PRODUCTS = 'ecommerce_products'

interface RawCategory {
  id: string
  name?: string | null
  slug?: string | null
  description?: string | null
  parent_id?: string | null
  sort?: number | null
  image?: string | null
}

interface RawProduct {
  id: string
  title?: string | null
  slug?: string | null
  sku?: string | null
  description?: string | null
  price?: number | string | null
  compare_at_price?: number | string | null
  stock?: number | null
  status?: string | null
  // El nombre de la relación varía según cómo se creó el campo.
  ecommerce_product_categories_id?: string | null
  category_id?: string | null
  brand?: string | null
  badge?: string | null
  is_featured?: boolean | null
  sort?: number | null
  featured_image?: string | null
  gallery?: string[] | null
  meta_title?: string | null
  meta_description?: string | null
  created_at?: string | null
}

// Los decimales pueden llegar como string.
const toMoney = (value: unknown) => {
  const n = Math.round(Number(value))
  return Number.isFinite(n) && n > 0 ? n : 0
}

const BADGES: ProductBadge[] = ['nuevo', 'oferta', 'mas_vendido']
const PLACEHOLDER = '/images/brand/dog-doggi-logo.webp'

function mapCategory(raw: RawCategory): Category | null {
  if (!raw.slug || !raw.name) return null
  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    description: raw.description ?? undefined,
    parentId: raw.parent_id ?? null,
    image: strataFileUrl(raw.image),
    sort: raw.sort ?? 0,
  }
}

function mapProduct(raw: RawProduct): Product | null {
  const price = toMoney(raw.price)
  if (!raw.slug || !raw.title || !price) return null
  const compareAt = toMoney(raw.compare_at_price)
  const gallery = (raw.gallery ?? []).map((id) => strataFileUrl(id)).filter((url): url is string => Boolean(url))
  const image = strataFileUrl(raw.featured_image) ?? gallery[0] ?? PLACEHOLDER
  return {
    id: raw.id,
    slug: raw.slug,
    sku: raw.sku ?? undefined,
    name: raw.title,
    description: raw.description ?? undefined,
    price,
    compareAtPrice: compareAt > price ? compareAt : undefined,
    image,
    images: [image, ...gallery.filter((url) => url !== image)],
    categoryId: raw.ecommerce_product_categories_id ?? raw.category_id ?? null,
    brand: raw.brand ?? undefined,
    badge: BADGES.includes(raw.badge as ProductBadge) ? (raw.badge as ProductBadge) : undefined,
    featured: Boolean(raw.is_featured),
    stock: typeof raw.stock === 'number' ? raw.stock : null,
    createdAt: raw.created_at ?? new Date(0).toISOString(),
    sort: raw.sort ?? 0,
    metaTitle: raw.meta_title ?? undefined,
    metaDescription: raw.meta_description ?? undefined,
  }
}

export async function loadStrataCatalog(): Promise<Catalog> {
  const [rawCategories, rawProducts] = await Promise.all([
    strataAllItems<RawCategory>(CATEGORIES, { lang: 'es' }),
    strataAllItems<RawProduct>(PRODUCTS, { lang: 'es', filter: { status: 'published' } }),
  ])
  return {
    categories: rawCategories.map(mapCategory).filter((c): c is Category => c !== null),
    // Re-chequeo del filtro: si Strata lo ignorara llegarían borradores.
    products: rawProducts
      .filter((p) => p.status === 'published')
      .map(mapProduct)
      .filter((p): p is Product => p !== null),
    source: 'strata',
  }
}
