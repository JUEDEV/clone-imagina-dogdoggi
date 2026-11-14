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
| Molecules | `components/molecules/` | `.astro` | `SectionHeading`, `HeroSlide`, `ProductCard` (variantes `default`/`feature`/`compact`), `CategoryCard`, `TrustItem`, `ArticleCard`, `ArticleBlock`, `TestimonialCard`, `VideoCard`, `FooterColumn`, `Breadcrumb`, `ServiceCard`, `LocationCard` (variantes `about`/`contact`), `FormField`, `Pagination` |
| Organisms | `components/organisms/` | `.astro` | Compartidos: `UtilityBar`, `Header`, `Footer`, `WhatsAppFloat`, `PageHero` (layout `default`/`split`), `CtaCierre`, `Sedes` (variantes `about`/`contact`). `nosotros/`: `Historia`, `QueHacemos`, `CtaEquipar`. `contacto/`: `ContactoMain`, `ContactForm`, `ContactChannels`. `home/`: `HeroSlider`, `Categorias`, `PerfectGroom`, `Destacados`, `Ofertas`, `TrustStrip`, `BlogPreview`, `Testimonios`, `Videos`. `blog/`: `ArticleGrid`, `ArticleBody`, `RelatedArticles`. `catalog/`: `CatalogHeader`, `FiltersSidebar`, `ProductListing`. `producto/`: `ProductDetail`, `RelatedProducts`. `checkout/`: `OrderSummary` |
| Islands | `components/islands/` | `.tsx` | **Lo único que envía JS de React al navegador** |
| UI | `components/ui/` | `.tsx` | shadcn/ui copiado intacto de la plantilla |

Los datos viven en `src/data/*.ts` con `interface` + arrays tipados: `site.ts` (WhatsApp, redes, navegación, columnas del footer, correo, horario y sedes con `LOCATIONS`/`mapsUrl`), `colombia-locations.ts` (departamentos y municipios DANE, de Herbolario), `home.ts` (slides, categorías, beneficios, confianza, testimonios, videos), `blog.ts`, `nosotros.ts` (hitos, servicios, texto de sedes) y `contacto.ts` (tipos de consulta, enlace de política de datos). `src/lib/` tiene `utils.ts` (`cn`), `seo.ts`, `icons.ts`, `money.ts`, `env.ts` (`serverEnv`, variables leídas al ejecutarse) y los módulos de la tienda y del correo (ver abajo). El carrito vive en `src/stores/cart.ts`.

## Islas (hidratación)

Regla: **solo es isla lo que Astro no puede resolver sin JS**, y la isla aporta *comportamiento*, no marcado.

| Isla | Usada en | Directiva | Por qué |
|---|---|---|---|
| `Carousel.tsx` | `home/HeroSlider`, `home/Testimonios` | `client:visible` | Embla: arrastre, loop, autoplay (el hero se pausa al pasar el mouse; `pauseButton` opcional), flechas, puntos y contador |
| `SearchBox.tsx` | `Header` | `client:visible` | Consulta `/api/search` y pinta resultados (+ enlace a `/productos?q=`); en móvil abre el buscador flotante |
| `CartDrawer.tsx` | `Header` | `client:idle` | Botón con contador + panel lateral (Radix Sheet). Lee el carrito de localStorage |
| `AddToCart.tsx` | `ProductCard` (`client:idle`), `producto/ProductDetail` (`client:load`, con cantidad) | ver uso | Agrega al store y abre el panel. `idle` en tarjetas: con `visible`, un clic al hacer scroll llegaba antes de hidratar |
| `CartPage.tsx` | `/carrito` | `client:only` | El carrito solo existe en el navegador |
| `CheckoutForm.tsx` | `/checkout` | `client:only` | Formulario + resumen; valida con `lib/checkout/form.ts` (mismas reglas que el servidor) |
| `PaymentReturn.tsx` | `/pago/retorno` | `client:only` | Consulta `/api/payments/status` cada 3 s y vacía el carrito al aprobarse |
| `MegaMenu.tsx` | `Header` | `client:media="(min-width: 768px)"` | Radix NavigationMenu: lista vertical de categorías (`SHOP_MENU`); las que tienen subcategorías las despliegan al lado al pasar el mouse o enfocar; si no, banner Perfect Groom (slot `featured`) |
| `MobileMenu.tsx` | `Header` | `client:media="(max-width: 767px)"` | Radix Sheet (dialog, focus trap); Tienda en acordeón de dos niveles (categoría → subcategorías) |

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
- **Pestañas** (sedes en móvil, filtro de destacados del home): radios nativos + `:has()`; como dependen de datos (sedes, categorías raíz del CMS), la regla CSS por pestaña se genera en el organismo (Tailwind no ve clases dinámicas).
- **Formulario de contacto** (`contacto/ContactForm`): `<script>` corto que valida, pinta errores (`data-invalid` en `FormField`, utilidad `form-control`) y hace `fetch` a `/api/contacto`; el estado (`sending`/`success`/`error`) va en `data-state` del form y el CSS lo refleja con `group-data-[state=*]/form`.
- **Filtros y orden del catálogo**: enlaces y un `<form method="get">` (el orden se envía al cambiar el select con un `<script>` corto). Galería de la ficha: `<script>` que cambia la foto principal.

## Tienda (catálogo, carrito y checkout)

Modelo de páginas y UX: front de **Herbolario**. Datos: plugin ecommerce de **Strata** (patrón de Kristal Shop, skill `conectar-cms`).

- **Catálogo** (`lib/catalog/`): `getCatalog()` carga categorías y productos publicados de Strata (`strata.ts`) con caché de 60 s y sirve la última copia buena si Strata falla. **Sin `CMS_BASE_URL` usa `sample.ts`**, con la misma forma. Filtros (`marca`, `precio`, `destacado`, `categoria`), orden (`orden`), búsqueda (`q`: sin tildes, por prefijo, singular/plural y un error de tipeo) y paginación (12) se hacen en memoria (`listing.ts`), porque Strata solo filtra por igualdad. Las páginas con filtros llevan `noindex`.
- **Campos propios a crear en `ecommerce_products`**: `compare_at_price`, `brand`, `badge` (`nuevo`/`oferta`/`mas_vendido`), `is_featured`, `sort`, `gallery`, `meta_title`, `meta_description`. Las imágenes pasan por el proxy `/api/strata/files/[id]` (URLs firmadas de 1 h).
- **Carrito** (`stores/cart.ts`): nanostores + localStorage, tope por stock. El precio guardado es solo para pintar.
- **Checkout** (`pages/api/checkout.ts`): valida el formulario (`lib/checkout/form.ts`), **recalcula precios y stock** desde el catálogo (`quote.ts`), toma el costo de envío del método elegido (`shipping.ts`: `ecommerce_shipment_methods` con `config.price`/`pickup`/`description`, o por defecto envío nacional contra entrega + recoger en cada sede) y crea el pedido.
- **Pedidos** (`lib/orders/`): `strata-repository.ts` escribe `ecommerce_orders`, `ecommerce_order_items` (con `position` en `options`) y `ecommerce_order_transactions`; si fallan líneas o transacción, la orden queda `cancelled`. Sin Strata, en desarrollo se usa `.data/orders.json` (gitignored); en producción sin Strata el checkout responde 503. Referencia: `DD-AAAAMMDD-XXXXXXXX`.
- **Pagos** (`lib/payments/`, plantilla Wompi de `conectar-cms`): redirección a Web Checkout con firma de integridad; confirmación por retorno, webhook (`/api/payments/wompi/webhook`) o consulta por referencia, todo con `settleOrder` (monto y referencia deben coincidir; un pago aprobado nunca se degrada). Sin llaves: simulador `/pago/prueba` en desarrollo.

## Correo (formulario de contacto)

`pages/api/contacto.ts` (SSR) → `lib/forms/contact.ts` (valida con los mismos mensajes que el cliente, honeypot `website`) → `lib/mail/smtp.ts` (Nodemailer, plantilla de la skill `correo-smtp`) con el aviso de `lib/mail/templates/contact-notification.ts` (`replyTo` = cliente). Como aún no hay CMS para guardarlo, el correo **es** el registro: sin SMTP responde 503, si el envío falla 502, y el formulario muestra el error con enlace a WhatsApp.

## Variables de entorno

Ver `.env.example`. Todas las de servidor (`CMS_*`, `WOMPI_*`, `SMTP_*`, `CONTACT_NOTIFY_TO`) se leen al ejecutarse: van en Dokploy, sin comillas, y no requieren recompilar.

## Pendiente de backend

- `SHOP_MENU` (`data/site.ts`) es fijo porque las páginas estáticas se generan sin Strata: al conectar el CMS, los slugs deben coincidir. Faltan las subcategorías de Cosmética, Complementos, Máquinas, Cuchillas, Vestuario y Formación.
- Cuenta, favoritos y login de clientes (fase 2, con `ecommerce_customers` de Strata).
- Conectar Strata: tenant con plugin ecommerce, campos propios de productos, métodos de pago (`wompi`, `manual`) y de envío; seed del catálogo de muestra.
- Correo y horario de atención, hitos de la línea de tiempo, foto del equipo, página de política de datos (`PRIVACY_POLICY_URL`) y tarifas de envío están como marcadores con `TODO`.

## Páginas

- `pages/index.astro`: orquesta los organismos del home; **SSR** (las vitrinas leen el catálogo) y JSON-LD `PetStore`.
- `pages/nosotros.astro` y `pages/contacto.astro` (prerender, `PageHero layout="split"`, JSON-LD `BreadcrumbList`; Contacto suma un `PetStore` por sede). `pages/api/contacto.ts` (SSR, POST del formulario).
- Tienda (SSR): `productos/index.astro` (catálogo y búsqueda), `categorias/[slug].astro`, `productos/[slug].astro` (JSON-LD `Product`), `checkout/index.astro`, `checkout/gracias.astro`, `pago/retorno.astro`, `pago/prueba.astro` (solo sin llaves y en desarrollo). `carrito.astro` es prerender (cascarón). Slugs inexistentes devuelven una `Response` 404 vacía y Astro pinta `404.astro` (no se puede hacer `rewrite` a una ruta prerenderizada).
- `pages/blog/index.astro` y `pages/blog/[slug].astro` (`getStaticPaths` sobre `ARTICLES`, JSON-LD `BreadcrumbList` + `BlogPosting`). Para publicar un artículo basta con agregarlo a `data/blog.ts`.
- Cada página pasa `preloadImage` al `Layout` para precargar su foto de hero.
- `pages/404.astro` (prerender), `pages/robots.txt.ts` (bloquea `/api/`, carrito, checkout y pagos), `pages/api/search.ts` (SSR). El sitemap de las páginas prerenderizadas lo genera `@astrojs/sitemap` (`/sitemap.xml` redirige a `/sitemap-index.xml`); productos y categorías van en `sitemap-catalog.xml.ts` (SSR). `robots.txt` lista los dos.

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
