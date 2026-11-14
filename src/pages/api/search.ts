import type { APIRoute } from 'astro'
import { findCategoryById, getCatalog, searchProducts } from '@/lib/catalog'
import { money } from '@/lib/money'

// Sugerencias del buscador del header. Usa la misma búsqueda que /productos?q=.
export const prerender = false

const LIMIT = 6

export const GET: APIRoute = async ({ url }) => {
  const query = (url.searchParams.get('q') ?? '').trim()
  if (!query || query.length > 80) {
    return Response.json({ error: 'El parámetro q debe tener entre 1 y 80 caracteres.' }, { status: 400 })
  }

  const catalog = await getCatalog()
  const found = searchProducts(catalog, query)
  // Solo lo que pinta la isla.
  const products = found.slice(0, LIMIT).map((product) => ({
    id: product.id,
    name: product.name,
    category: findCategoryById(catalog, product.categoryId)?.name ?? '',
    price: money(product.price),
    image: product.image,
    href: `/productos/${product.slug}`,
  }))

  return Response.json({ products, total: found.length }, { headers: { 'Cache-Control': 'public, max-age=60' } })
}
