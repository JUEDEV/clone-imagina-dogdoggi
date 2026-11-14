/**
 * Cliente REST mínimo de Strata (solo servidor). Plantilla de la skill conectar-cms.
 *
 * `CMS_BASE_URL` es la raíz de la API (`https://<admin>/api`) y `CMS_STATIC_TOKEN`
 * va como Bearer. Ambas se leen al ejecutarse: sin `CMS_BASE_URL` el sitio usa
 * el catálogo de muestra (ver `lib/catalog`).
 *
 * Peculiaridades de Strata que este cliente contempla:
 * - Solo filtros de igualdad (`filter[campo]=valor`). Un filtro mal escrito se
 *   ignora y devuelve TODA la colección: las búsquedas por slug re-chequean.
 * - Filtrar u ordenar por un campo inexistente da 500.
 * - `limit` máximo 50: `strataAllItems` pagina.
 * - Los borradores no se ocultan: filtrar `status` a mano.
 * - Lecturas válidas fallan a veces con 5xx: se reintentan.
 * - Al crear, Strata responde 200/201 aunque no guarde la fila: se relee por id.
 */
import { serverEnv } from '@/lib/env'

export class StrataUnconfiguredError extends Error {
  constructor() {
    super('Strata no está configurado (falta CMS_BASE_URL)')
    this.name = 'StrataUnconfiguredError'
  }
}

export class StrataRequestError extends Error {
  constructor(
    readonly status: number,
    detail: string,
  ) {
    super(`Strata respondió ${status} (${detail})`)
    this.name = 'StrataRequestError'
  }
}

export const isStrataConfigured = () => Boolean(serverEnv('CMS_BASE_URL'))

export const STRATA_MAX_LIMIT = 50

export interface StrataQuery {
  filter?: Record<string, string | number | boolean>
  lang?: string
  /** Campo, `-campo` para descendente. */
  sort?: string
  limit?: number
  page?: number
  deep?: string[]
}

export interface StrataPage<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

function baseUrl(): string {
  const base = serverEnv('CMS_BASE_URL')
  if (!base) throw new StrataUnconfiguredError()
  return base.replace(/\/+$/, '')
}

function buildUrl(path: string, query: StrataQuery = {}): URL {
  const url = new URL(`${baseUrl()}${path}`)
  for (const [field, value] of Object.entries(query.filter ?? {})) url.searchParams.set(`filter[${field}]`, String(value))
  if (query.lang) url.searchParams.set('lang', query.lang)
  if (query.sort) url.searchParams.set('sort', query.sort)
  if (query.limit) url.searchParams.set('limit', String(query.limit))
  if (query.page) url.searchParams.set('page', String(query.page))
  if (query.deep?.length) url.searchParams.set('deep', query.deep.join(','))
  return url
}

const headers = (json = false): HeadersInit => {
  const token = serverEnv('CMS_STATIC_TOKEN')
  return {
    Accept: 'application/json',
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

const RETRIES_ON_SERVER_ERROR = 2

async function strataRequest<T>(path: string, query: StrataQuery = {}): Promise<T> {
  let response: Response
  for (let attempt = 0; ; attempt++) {
    response = await fetch(buildUrl(path, query), { headers: headers(), signal: AbortSignal.timeout(15_000) })
    if (response.status < 500 || attempt === RETRIES_ON_SERVER_ERROR) break
  }
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new StrataRequestError(response.status, `${path}: ${body.slice(0, 200)}`)
  }
  return (await response.json()) as T
}

export async function strataItems<T>(collection: string, query: StrataQuery = {}): Promise<StrataPage<T>> {
  const json = await strataRequest<Partial<StrataPage<T>>>(`/items/${collection}`, query)
  return {
    data: json.data ?? [],
    total: json.total ?? json.data?.length ?? 0,
    page: json.page ?? query.page ?? 1,
    limit: json.limit ?? STRATA_MAX_LIMIT,
  }
}

export async function strataAllItems<T>(collection: string, query: Omit<StrataQuery, 'limit' | 'page'> = {}): Promise<T[]> {
  const items: T[] = []
  for (let page = 1; ; page++) {
    const result = await strataItems<T>(collection, { ...query, limit: STRATA_MAX_LIMIT, page })
    items.push(...result.data)
    if (result.data.length === 0 || items.length >= result.total) return items
  }
}

export async function strataItem<T>(collection: string, id: string, query: Pick<StrataQuery, 'lang' | 'deep'> = {}): Promise<T | null> {
  try {
    const json = await strataRequest<T | { data: T }>(`/items/${collection}/${encodeURIComponent(id)}`, query)
    return json && typeof json === 'object' && 'data' in json ? json.data : (json as T)
  } catch (error) {
    if (error instanceof StrataRequestError && error.status === 404) return null
    throw error
  }
}

async function strataWrite<T>(method: 'POST' | 'PATCH', path: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${baseUrl()}${path}`, {
    method,
    headers: headers(true),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  })
  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new StrataRequestError(response.status, `${method} ${path}: ${detail.slice(0, 200)}`)
  }
  const json = (await response.json().catch(() => ({}))) as T | { data: T }
  return json && typeof json === 'object' && 'data' in json ? json.data : (json as T)
}

/** Crea una fila y la relee: Strata a veces responde OK sin guardarla. */
export async function strataCreateItem<T extends { id: string }>(collection: string, body: Record<string, unknown>, lang = 'es'): Promise<T> {
  const created = await strataWrite<T>('POST', `/items/${collection}`, { language: lang, ...body })
  const stored = created?.id ? await strataItem<T>(collection, created.id, { lang }) : null
  if (!stored) throw new StrataRequestError(500, `POST /items/${collection}: la fila no quedó guardada`)
  return stored
}

export async function strataUpdateItem<T>(collection: string, id: string, body: Record<string, unknown>, lang = 'es'): Promise<T> {
  return strataWrite<T>('PATCH', `/items/${collection}/${encodeURIComponent(id)}?lang=${lang}`, body)
}

export interface StrataFile {
  id: string
  filename: string
  content_type: string
  is_public: boolean
  /** URL firmada; vence en una hora. */
  url: string
}

export async function strataFile(id: string): Promise<StrataFile | null> {
  try {
    const json = await strataRequest<StrataFile | { data: StrataFile }>(`/files/${encodeURIComponent(id)}`)
    return 'data' in json ? json.data : json
  } catch (error) {
    if (error instanceof StrataRequestError && error.status === 404) return null
    throw error
  }
}
