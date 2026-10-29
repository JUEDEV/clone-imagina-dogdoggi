FROM node:22-alpine AS builder

WORKDIR /app

ENV HOST=0.0.0.0
ENV PORT=4321
ENV NODE_ENV=production
# astro.config.mjs lee esto en build (no en runtime) para fijar `site`, del
# que dependen el sitemap, robots.txt y los canonical/og:url.
ARG PUBLIC_SITE_URL=https://dogdoggi.com
ENV PUBLIC_SITE_URL=$PUBLIC_SITE_URL

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build --mode production


# ---- Runtime image ----
FROM node:22-alpine AS runtime

WORKDIR /app

ENV HOST=0.0.0.0
ENV PORT=4321
ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

EXPOSE 4321

CMD ["node", "./dist/server/entry.mjs"]
