import { isStrataConfigured } from '@/lib/strata'
import { localOrderRepository } from './local-repository'
import { strataOrderRepository } from './strata-repository'
import type { OrderRepository } from './types'

/** Strata si está configurado; archivo local solo en desarrollo; si no, la tienda no recibe pedidos. */
export function getOrderRepository(): OrderRepository | null {
  if (isStrataConfigured()) return strataOrderRepository
  return import.meta.env.DEV ? localOrderRepository : null
}
