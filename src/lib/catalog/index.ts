import { isStrataConfigured } from '@/lib/strata'
import { SAMPLE_CATALOG } from './sample'
import { loadStrataCatalog } from './strata'
import type { Catalog, Category, Product } from './types'

export type { Catalog, Category, Product, ProductBadge } from './types'

/*
 * Catálogo completo en memoria (como Herbolario y Kristal Shop): Strata solo
 * filtra por igualdad, así que filtros, orden, búsqueda y paginación se hacen
 * aquí. Caché de 60 s; si Strata falla se sirve la última copia buena.
 */

const CACHE_TTL_MS = 60_000
let cached: { catalog: Catalog; at: number } | null = null
let inflight: Promise<Catalog> | null = null

export async function getCatalog(): Promise<Catalog> {
  if (!isStrataConfigured()) return SAMPLE_CATALOG
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.catalog

  inflight ??= loadStrataCatalog()
    .then((catalog) => {
      cached = { catalog, at: Date.now() }
      return catalog
    })
    .catch((error) => {
      console.error('[catalog] no se pudo leer Strata', error instanceof Error ? error.message : error)
      return cached?.catalog ?? { categories: [], products: [], source: 'strata' as const }
    })
    .finally(() => {
      inflight = null
    })
  return inflight
}

/* ---- Consultas ---- */

export const findProductBySlug = (catalog: Catalog, slug: string) => catalog.products.find((p) => p.slug === slug)
export const findProductById = (catalog: Catalog, id: string) => catalog.products.find((p) => p.id === id)
export const findCategoryBySlug = (catalog: Catalog, slug: string) => catalog.categories.find((c) => c.slug === slug)
export const findCategoryById = (catalog: Catalog, id: string | null) =>
  id ? catalog.categories.find((c) => c.id === id) : undefined

const bySort = (a: Category, b: Category) => a.sort - b.sort || a.name.localeCompare(b.name, 'es')

export const rootCategories = (catalog: Catalog) => catalog.categories.filter((c) => !c.parentId).sort(bySort)
export const childCategories = (catalog: Catalog, parentId: string) =>
  catalog.categories.filter((c) => c.parentId === parentId).sort(bySort)

/** Ruta de la raíz a la categoría (para breadcrumbs). */
export function categoryPath(catalog: Catalog, category: Category | undefined): Category[] {
  const path: Category[] = []
  for (let current = category; current && path.length < 10; current = findCategoryById(catalog, current.parentId)) {
    path.unshift(current)
  }
  return path
}

/** Ids de la categoría y todas sus descendientes. */
export function categoryTreeIds(catalog: Catalog, category: Category): Set<string> {
  const ids = new Set([category.id])
  for (let added = true; added; ) {
    added = false
    for (const c of catalog.categories) {
      if (c.parentId && ids.has(c.parentId) && !ids.has(c.id)) {
        ids.add(c.id)
        added = true
      }
    }
  }
  return ids
}

export const productsInCategory = (catalog: Catalog, category: Category) => {
  const ids = categoryTreeIds(catalog, category)
  return catalog.products.filter((p) => p.categoryId && ids.has(p.categoryId))
}

/** Datos que la tarjeta necesita de la categoría (nombre y raíz para filtros). */
export function cardContext(catalog: Catalog, product: Product) {
  const category = findCategoryById(catalog, product.categoryId)
  return { categoryName: category?.name, kind: categoryPath(catalog, category)[0]?.slug }
}

export const isInStock =(product: Product) => product.stock === null || product.stock > 0
export const isOnSale = (product: Product) => Boolean(product.compareAtPrice)

const NEW_WINDOW_MS = 90 * 24 * 60 * 60 * 1000
export const isNew = (product: Product) =>
  product.badge === 'nuevo' || Date.now() - new Date(product.createdAt).getTime() < NEW_WINDOW_MS

export function relatedProducts(catalog: Catalog, product: Product, limit = 4): Product[] {
  const sameCategory = catalog.products.filter((p) => p.id !== product.id && p.categoryId === product.categoryId)
  const sameBrand = product.brand ? catalog.products.filter((p) => p.id !== product.id && p.brand === product.brand) : []
  const rest = catalog.products.filter((p) => p.id !== product.id)
  return [...new Set([...sameCategory, ...sameBrand, ...rest])].slice(0, limit)
}

export const brandsOf = (products: Product[]) =>
  [...new Set(products.map((p) => p.brand).filter((b): b is string => Boolean(b)))].sort((a, b) => a.localeCompare(b, 'es'))

/* ---- Búsqueda ---- */

export const normalize = (text: string) =>
  text
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

const STOPWORDS = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'para', 'con', 'y', 'en', 'un', 'una'])

// Singular/plural simple: "tijeras" encuentra "tijera" y al revés.
const stem = (word: string) => word.replace(/(es|s)$/, '')

// Un error de tipeo (letra cambiada, sobrante o faltante) en términos de 4+ letras: "shampu" → "shampoo".
function nearlyPrefix(word: string, term: string): boolean {
  if (term.length < 4) return false
  const candidate = word.slice(0, term.length + 1)
  const a = term
  let prev = Array.from({ length: candidate.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const row = [i]
    for (let j = 1; j <= candidate.length; j++) {
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === candidate[j - 1] ? 0 : 1))
    }
    prev = row
  }
  // Distancia contra cualquier prefijo del candidato (prefijo con un error).
  return Math.min(...prev.slice(Math.max(1, a.length - 1))) <= 1
}

/**
 * Búsqueda por palabras: cada término debe coincidir (por prefijo, sin tildes
 * ni plural) en nombre, marca, categoría, SKU o descripción. Pesa más el nombre.
 */
export function searchProducts(catalog: Catalog, query: string): Product[] {
  const terms = normalize(query)
    .split(/[^a-z0-9ñ]+/)
    .filter((t) => t && !STOPWORDS.has(t))
    .map(stem)
  if (!terms.length) return []

  const scored = catalog.products.map((product) => {
    const category = findCategoryById(catalog, product.categoryId)?.name ?? ''
    const fields: [string, number][] = [
      [product.name, 3],
      [`${product.brand ?? ''} ${category} ${product.sku ?? ''}`, 2],
      [(product.description ?? '').replace(/<[^>]+>/g, ' '), 1],
    ]
    const words = fields.map(([text, weight]) => [normalize(text).split(/[^a-z0-9ñ]+/).map(stem), weight] as const)
    let score = 0
    for (const term of terms) {
      const exact = Math.max(0, ...words.map(([list, weight]) => (list.some((w) => w.startsWith(term)) ? weight : 0)))
      // Sin coincidencia exacta se acepta un error de tipeo, con menos peso.
      const fuzzy = exact ? 0 : Math.max(0, ...words.map(([list, weight]) => (list.some((w) => nearlyPrefix(w, term)) ? weight / 2 : 0)))
      if (!exact && !fuzzy) return { product, score: 0 }
      score += exact || fuzzy
    }
    return { product, score }
  })

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.product)
}
