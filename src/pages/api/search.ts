import type { APIRoute } from 'astro'
import { money, productHref, searchProducts } from '@/data/products'

// Endpoint del buscador del header (reemplaza el tRPC de la plantilla).
// Corre en el servidor; cuando se conecte el CMS basta con cambiar searchProducts.
export const prerender = false

export const GET: APIRoute = ({ url }) => {
  const query = (url.searchParams.get('q') ?? '').trim()

  if (!query || query.length > 100) {
    return Response.json({ error: 'El parámetro q debe tener entre 1 y 100 caracteres.' }, { status: 400 })
  }

  // Solo lo que pinta la isla.
  const results = searchProducts(query).map((product) => ({
    id: product.id,
    name: product.name,
    category: product.category,
    price: money(product.price),
    image: product.image,
    href: productHref(product),
  }))

  return Response.json(results, { headers: { 'Cache-Control': 'public, max-age=60' } })
}
