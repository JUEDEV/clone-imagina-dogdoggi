import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createOrderReference } from './reference'
import type { NewOrder, Order, OrderRepository } from './types'

/*
 * Pedidos en un archivo JSON (`.data/orders.json`, ignorado por git). Solo para
 * desarrollo sin Strata: permite probar el checkout de punta a punta con el
 * pago simulado. En producción nunca se usa (ver repository.ts).
 */

const FILE = join(process.cwd(), '.data', 'orders.json')

async function readAll(): Promise<Order[]> {
  try {
    return JSON.parse(await readFile(FILE, 'utf8')) as Order[]
  } catch {
    return []
  }
}

async function writeAll(orders: Order[]) {
  await mkdir(join(process.cwd(), '.data'), { recursive: true })
  await writeFile(FILE, JSON.stringify(orders, null, 2))
}

export const localOrderRepository: OrderRepository = {
  async create(input: NewOrder) {
    const order: Order = { ...input, reference: createOrderReference(), status: 'awaiting_payment', created_at: new Date().toISOString() }
    await writeAll([...(await readAll()), order])
    return order
  },
  async findByReference(reference) {
    return (await readAll()).find((order) => order.reference === reference) ?? null
  },
  async update(reference, changes) {
    const orders = await readAll()
    await writeAll(orders.map((order) => (order.reference === reference ? { ...order, ...changes } : order)))
  },
}
