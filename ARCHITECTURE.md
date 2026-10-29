# Arquitectura — Dog Doggi

Migración de la plantilla Kimi (React/Vite/TSX + tRPC/Hono/Drizzle) a **Astro 6 + islas React + Tailwind v4 + shadcn/ui**, con la misma estructura que Brunata Spa.

## Config raíz

- `astro.config.mjs`: `output: 'server'` + `@astrojs/node` standalone, `@astrojs/react`, `@astrojs/sitemap`, Tailwind v4 vía `@tailwindcss/vite` (sin `tailwind.config`), alias `@` → `src`. El dominio sale de `PUBLIC_SITE_URL` en el build (por defecto `https://dogdoggi.com`). `optimizeDeps.include` lista las dependencias de las islas.
- `tsconfig.json`: `astro/tsconfigs/strict`, `@/*`, `jsx: react-jsx`.
- `src/styles/global.css`: tokens de marca en `@theme` (`navy`, `turquoise`, `turquoise-dark`, `orange`, `orange-dark`, `yellow`, `ink-soft`, `surface`, `line`, `paper`, fondos `sky`/`mint`/`peach` y la línea Perfect Groom `pg-blue`/`pg-ink`/`pg-deep`), fuentes `display` (Fredoka) y `sans` (Nunito), breakpoints `xs` (391px) y `desk` (1101px) de la plantilla, variables shadcn y utilidades `shell` (contenedor de 1400px), `scrollbar-none` y `.reveal`.

> Los breakpoints van en `rem` dentro de `@theme`: con variantes arbitrarias en px (`min-[1101px]:`) Tailwind no las ordena frente a `md:` y `md:` termina ganando.

## Atomic design

| Capa | Ruta | Ext. | Qué hay |
|---|---|---|---|
| Atoms | `components/atoms/` | `.astro` | `Head`, `Icon` (trazos en `lib/icons.ts`), `IconButton`, `ButtonLink`, `Reveal`, `Eyebrow`, `Accent`, `Logo` |
| Molecules | `components/molecules/` | `.astro` | `SectionHeading`, `HeroSlide`, `ProductCard` (variantes `default`/`feature`/`compact`), `CategoryCard`, `TrustItem`, `ArticleCard`, `ArticleBlock`, `TestimonialCard`, `VideoCard`, `FooterColumn`, `Breadcrumb` |
| Organisms | `components/organisms/` | `.astro` | Compartidos: `UtilityBar`, `Header`, `Footer`, `WhatsAppFloat`, `PageHero`, `CtaCierre`. `home/`: `HeroSlider`, `Categorias`, `PerfectGroom`, `Destacados`, `Ofertas`, `TrustStrip`, `BlogPreview`, `Testimonios`, `Videos`. `blog/`: `ArticleGrid`, `ArticleBody`, `RelatedArticles` |
| Islands | `components/islands/` | `.tsx` | **Lo único que envía JS de React al navegador** |
| UI | `components/ui/` | `.tsx` | shadcn/ui copiado intacto de la plantilla |

Los datos viven en `src/data/*.ts` con `interface` + arrays tipados: `site.ts` (WhatsApp, redes, navegación, columnas del footer), `products.ts` (catálogo de muestra, `money`, `searchProducts`, `productHref`), `home.ts` (slides, categorías, beneficios, confianza, testimonios, videos) y `blog.ts`. `src/lib/` tiene `utils.ts` (`cn`), `seo.ts` e `icons.ts`.

## Islas (hidratación)

Regla: **solo es isla lo que Astro no puede resolver sin JS**, y la isla aporta *comportamiento*, no marcado.

| Isla | Usada en | Directiva | Por qué |
|---|---|---|---|
| `Carousel.tsx` | `home/HeroSlider`, `home/Testimonios` | `client:visible` | Embla: arrastre, loop, autoplay (el hero se pausa al pasar el mouse; `pauseButton` opcional), flechas, puntos y contador |
| `SearchBox.tsx` | `Header` | `client:visible` | Consulta `/api/search` y pinta resultados; en móvil abre el buscador flotante |
| `MegaMenu.tsx` | `Header` | `client:media="(min-width: 768px)"` | Radix NavigationMenu: abre con hover y teclado, cierra con Escape |
| `MobileMenu.tsx` | `Header` | `client:media="(max-width: 767px)"` | Radix Sheet (dialog, focus trap) con submenú de tienda |

Patrones:

- **Slides como children**: `HeroSlide` y `TestimonialCard` llevan `data-carousel-slide` y llegan a `Carousel` como HTML estático (Embla los busca por selector porque Astro los envuelve en `<astro-slot>`).
- **`data-active`**: `Carousel` marca el slide seleccionado; el CSS (`[data-active="true"] .hero-copy` en `global.css`) anima la entrada del texto del hero sin que la isla conozca el marcado.
- **Slots con nombre → props**: `slot="header"` (intro de testimonios), `slot="featured"` (banner Perfect Groom del mega menú) y `slot="cta"` (WhatsApp en el menú móvil).
- **Props serializables**: las islas solo reciben datos planos (p. ej. `dotLabel="Ir a diapositiva {n}"` en vez de una función).
- **Reveal**: un único `IntersectionObserver` en `Layout.astro` agrega `.is-visible` a todo `.reveal`.

Resuelto sin isla:

- **Filtro de destacados** (`home/Destacados`): radios + `group-has-[#filtro-x:checked]` ocultan las tarjetas por `data-kind`; la fila es un scroll-snap nativo.
- **Videos y artículos**: enlaces (YouTube y `/blog/[slug]`) en vez de los modales de la plantilla.
- **Toasts y modales de la plantilla**: eliminados; no tenían lógica real detrás.

## Pendiente de backend

- Cuenta, favoritos, carrito y "Agregar al carrito" se pintan pero **no tienen lógica**; se conectan con el ecommerce de Strata (skill `conectar-cms`).
- `productHref` apunta a `/#destacados` hasta que exista la ficha de producto.
- `pages/api/search.ts` filtra el catálogo de muestra; al conectar el CMS basta con cambiar `searchProducts`.

## Páginas

- `pages/index.astro`: orquesta los organismos del home; `prerender = true` y JSON-LD `PetStore`.
- `pages/blog/index.astro` y `pages/blog/[slug].astro` (`getStaticPaths` sobre `ARTICLES`, JSON-LD `BreadcrumbList` + `BlogPosting`). Para publicar un artículo basta con agregarlo a `data/blog.ts`.
- Cada página pasa `preloadImage` al `Layout` para precargar su foto de hero.
- `pages/404.astro` (prerender), `pages/robots.txt.ts` (bloquea `/api/`), `pages/api/search.ts` (SSR). El sitemap lo genera `@astrojs/sitemap` (`/sitemap.xml` redirige a `/sitemap-index.xml`).

## Imágenes

`public/images/brand/` (logos), `products/` (recortes de producto) y `photos/` (fotos en WebP, ≤1400px de ancho).

## Deploy

- `Dockerfile` multi-stage `node:22-alpine` (`ARG PUBLIC_SITE_URL`), sirve `dist/server/entry.mjs` en el puerto 4321.
- `.github/workflows/build.yml`: build en cada PR y push a `main`.
- `.github/workflows/docker-publish.yml`: en push a `main` publica `${REGISTRY_HOST}/imaginadevs/frontend-dog-doggi:latest` y `:sha` (secrets `REGISTRY_HOST`, `REGISTRY_USERNAME`, `REGISTRY_PASSWORD`; variable opcional `PUBLIC_SITE_URL`).

## Comandos

```bash
npm run dev      # desarrollo
npm run check    # astro check (tipos)
npm run build    # build de producción → dist/
node dist/server/entry.mjs   # servir el build (HOST/PORT)
```
