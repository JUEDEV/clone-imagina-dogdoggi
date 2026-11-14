# frontend-dog-doggi

Sitio de **Dog Doggi**, la tienda de herramientas, equipos y cosmética Perfect Groom para peluqueros caninos. Está hecho con Astro 6, islas React, Tailwind v4 y shadcn/ui, y la arquitectura se describe en [ARCHITECTURE.md](./ARCHITECTURE.md).

## Requisitos

Node `>=22.12.0`.

## Desarrollo

```bash
npm install
npm run dev
```

## Producción

```bash
npm run check
npm run build
node dist/server/entry.mjs
```

`PUBLIC_SITE_URL` (en el build) fija el dominio de los canonical, el sitemap y `robots.txt`. Por defecto es `https://dogdoggi.com`.

La tienda lee el catálogo y guarda los pedidos en Strata (`CMS_BASE_URL`, `CMS_STATIC_TOKEN`) y cobra con Wompi (`WOMPI_*`). Sin Strata usa un catálogo de muestra; sin llaves de Wompi el pago se simula en desarrollo. Todas las variables están en `.env.example`.

El formulario de `/contacto` envía por SMTP: en el contenedor van `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` y opcional `CONTACT_NOTIFY_TO` (ver `ARCHITECTURE.md`).

### Docker

```bash
docker build --build-arg PUBLIC_SITE_URL=https://dogdoggi.com -t frontend-dog-doggi .
docker run -p 4321:4321 frontend-dog-doggi
```

Cada push a `main` publica la imagen en el registry mediante `.github/workflows/docker-publish.yml`.

## Contenido

- Navegación, WhatsApp y redes: `src/data/site.ts`
- Catálogo de muestra y buscador: `src/data/products.ts`
- Home: `src/data/home.ts`
- Blog: `src/data/blog.ts`. Al agregar una entrada se crea su página `/blog/[slug]`.
