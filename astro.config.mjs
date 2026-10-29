import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

// `site` se hornea en el build (astro.config.mjs corre en Node puro, no en
// Vite, por eso `process.env` y no `import.meta.env`) y alimenta el sitemap y
// los canonical/og:url. PUBLIC_SITE_URL permite sobrescribirlo (p. ej. staging).
// TODO: confirmar el dominio de producción de Dog Doggi.
const site = process.env.PUBLIC_SITE_URL || 'https://dogdoggi.com';

export default defineConfig({
  site,
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  redirects: {
    '/sitemap.xml': '/sitemap-index.xml',
  },
  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.includes('/404'),
      serialize: (item) => ({ ...item, url: item.url.replace(/(.)\/$/, '$1') }),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    // Dependencias de las islas React: se pre-empaquetan al arrancar `astro dev`.
    // Si Vite las descubre a mitad de sesión re-optimiza y el navegador recibe
    // 504 "Outdated Optimize Dep": las islas no hidratan y los carruseles quedan quietos.
    optimizeDeps: {
      include: [
        'react',
        'react-dom/client',
        'react/jsx-runtime',
        'embla-carousel-react',
        'lucide-react',
        '@radix-ui/react-dialog',
        '@radix-ui/react-navigation-menu',
      ],
    },
  },
});
