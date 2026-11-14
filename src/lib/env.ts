// Variables de servidor leídas al ejecutarse (no en build): en Dokploy se
// cambian en el contenedor sin recompilar. En `astro dev` vienen del .env.
export const serverEnv = (name: string): string | undefined =>
  process.env[name] || (import.meta.env[name] as string | undefined) || undefined
