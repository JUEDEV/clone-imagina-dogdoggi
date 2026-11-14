import { isNew, isOnSale, normalize } from './index'
import type { Product } from './types'

/*
 * Filtros, orden y paginación de los listados (/productos y /categorias/[slug]),
 * leídos de la URL. Mismos parámetros que Herbolario: marca, precio, destacado,
 * orden, page (+ q y categoria en /productos).
 */

export const PAGE_SIZE = 12

export const PRICE_RANGES = [
  { value: 'hasta-100000', label: 'Hasta $100.000', min: 0, max: 100_000 },
  { value: '100000-250000', label: '$100.000 a $250.000', min: 100_000, max: 250_000 },
  { value: '250000-500000', label: '$250.000 a $500.000', min: 250_000, max: 500_000 },
  { value: 'mas-500000', label: 'Más de $500.000', min: 500_000, max: Infinity },
] as const

export const HIGHLIGHTS = [
  { value: 'ofertas', label: 'En oferta' },
  { value: 'novedades', label: 'Novedades' },
] as const

export const SORT_OPTIONS = [
  { value: '', label: 'Relevancia' },
  { value: 'price', label: 'Menor precio' },
  { value: '-price', label: 'Mayor precio' },
  { value: '-created_at', label: 'Novedades' },
  { value: 'title', label: 'Nombre A-Z' },
] as const

export interface ListingParams {
  q: string
  categorias: string[]
  marcas: string[]
  precios: string[]
  destacados: string[]
  orden: string
  page: number
}

// Acepta parámetros repetidos (?marca=a&marca=b) o separados por comas.
const many = (params: URLSearchParams, key: string) =>
  params
    .getAll(key)
    .flatMap((v) => v.split(','))
    .map((v) => v.trim())
    .filter(Boolean)

export function readListingParams(url: URL): ListingParams {
  const p = url.searchParams
  const orden = p.get('orden') ?? ''
  return {
    q: (p.get('q') ?? '').trim().slice(0, 80),
    categorias: many(p, 'categoria'),
    marcas: many(p, 'marca'),
    precios: many(p, 'precio').filter((v) => PRICE_RANGES.some((r) => r.value === v)),
    destacados: many(p, 'destacado').filter((v) => HIGHLIGHTS.some((h) => h.value === v)),
    orden: SORT_OPTIONS.some((o) => o.value === orden) ? orden : '',
    page: Math.max(1, Number.parseInt(p.get('page') ?? '1', 10) || 1),
  }
}

export const activeFilterCount = (params: ListingParams) =>
  params.marcas.length + params.precios.length + params.destacados.length + params.categorias.length

/** Aplica marca, precio y destacado (categoría y búsqueda las resuelve cada página). */
export function applyFilters(products: Product[], params: ListingParams): Product[] {
  const brands = new Set(params.marcas.map(normalize))
  const ranges = PRICE_RANGES.filter((r) => params.precios.includes(r.value))
  return products.filter((product) => {
    if (brands.size && !(product.brand && brands.has(normalize(product.brand)))) return false
    if (ranges.length && !ranges.some((r) => product.price >= r.min && product.price < r.max)) return false
    if (params.destacados.includes('ofertas') && !isOnSale(product)) return false
    if (params.destacados.includes('novedades') && !isNew(product)) return false
    return true
  })
}

export function sortProducts(products: Product[], orden: string): Product[] {
  const list = [...products]
  switch (orden) {
    case 'price':
      return list.sort((a, b) => a.price - b.price)
    case '-price':
      return list.sort((a, b) => b.price - a.price)
    case '-created_at':
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    case 'title':
      return list.sort((a, b) => a.name.localeCompare(b.name, 'es'))
    default:
      // Relevancia: destacados primero y luego el orden del CMS (o el de búsqueda).
      return list.sort((a, b) => Number(b.featured) - Number(a.featured))
  }
}

export function paginate<T>(items: T[], page: number, size = PAGE_SIZE) {
  const pageCount = Math.max(1, Math.ceil(items.length / size))
  const current = Math.min(page, pageCount)
  return { items: items.slice((current - 1) * size, current * size), page: current, pageCount, total: items.length }
}

/**
 * URL del listado con cambios: `null` o `[]` borra el parámetro; siempre
 * vuelve a la página 1 salvo que se pase `page`.
 */
export function listingUrl(url: URL, changes: Record<string, string | string[] | number | null>): string {
  const next = new URL(url.pathname + url.search, 'http://x')
  if (!('page' in changes)) next.searchParams.delete('page')
  for (const [key, value] of Object.entries(changes)) {
    next.searchParams.delete(key)
    const values = Array.isArray(value) ? value : value === null || value === '' ? [] : [String(value)]
    for (const v of values) if (!(key === 'page' && v === '1')) next.searchParams.append(key, v)
  }
  const qs = next.searchParams.toString()
  return `${next.pathname}${qs ? `?${qs}` : ''}`
}

export const toggle = (list: string[], value: string) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
