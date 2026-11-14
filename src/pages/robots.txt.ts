import type { APIRoute } from 'astro'

// sitemap-index.xml lo genera @astrojs/sitemap (páginas prerenderizadas);
// sitemap-catalog.xml lista productos y categorías, que son SSR y no los ve el build.
// /api/, carrito, checkout y pagos no tienen contenido indexable.
export const GET: APIRoute = ({ site }) => {
  const sitemaps = ['sitemap-index.xml', 'sitemap-catalog.xml'].map((file) => `Sitemap: ${new URL(file, site).href}`)
  const disallow = ['/api/', '/carrito', '/checkout', '/pago/'].map((path) => `Disallow: ${path}`)

  return new Response(`User-agent: *\nAllow: /\n${disallow.join('\n')}\n\n${sitemaps.join('\n')}\n`, {
    headers: { 'Content-Type': 'text/plain' },
  })
}
