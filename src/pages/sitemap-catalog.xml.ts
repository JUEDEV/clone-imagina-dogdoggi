import type { APIRoute } from 'astro'
import { getCatalog } from '@/lib/catalog'

// Sitemap SSR del catálogo (home, listado, categorías y productos), siempre al día con Strata.
export const prerender = false

const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export const GET: APIRoute = async ({ site }) => {
  const catalog = await getCatalog()
  const abs = (path: string) => escape(new URL(path, site).href)
  const urls: { loc: string; image?: string }[] = [
    { loc: abs('/') },
    { loc: abs('/productos') },
    ...catalog.categories.map((c) => ({ loc: abs(`/categorias/${c.slug}`) })),
    ...catalog.products.map((p) => ({ loc: abs(`/productos/${p.slug}`), image: p.image.startsWith('/') ? abs(p.image) : undefined })),
  ]
  const body = urls
    .map((u) => `<url><loc>${u.loc}</loc>${u.image ? `<image:image><image:loc>${u.image}</image:loc></image:image>` : ''}</url>`)
    .join('')
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${body}</urlset>`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=600' } },
  )
}
