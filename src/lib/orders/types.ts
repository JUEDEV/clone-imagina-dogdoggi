// Pedido de la tienda, independiente de dónde se guarde (Strata o archivo local en desarrollo).

export type OrderStatus = 'awaiting_payment' | 'paid' | 'fulfilled' | 'cancelled' | 'refunded'

export interface OrderContact {
  first_name: string
  last_name: string
  email: string
  phone: string
  identification_number: string
}

export interface OrderAddress {
  address_1: string
  address_2?: string
  city: string
  province: string
  notes?: string
}

export interface OrderLine {
  product_id: string
  slug: string
  name: string
  image: string
  sku?: string
  unit_price: number
  quantity: number
  subtotal: number
}

export interface OrderDelivery {
  /** `code` del método de envío (ecommerce_shipment_methods). */
  code: string
  label: string
  pickup: boolean
}

export interface OrderPayment {
  provider: 'wompi' | 'mock'
  transaction_id: string | null
  provider_status: string | null
  method_type: string | null
}

export interface Order {
  reference: string
  status: OrderStatus
  created_at: string
  contact: OrderContact
  delivery: OrderDelivery
  shipping_address: OrderAddress | null
  items: OrderLine[]
  subtotal: number
  shipping_total: number
  total: number
  payment: OrderPayment
}

export type NewOrder = Omit<Order, 'reference' | 'status' | 'created_at'>

export interface OrderRepository {
  create(order: NewOrder): Promise<Order>
  findByReference(reference: string): Promise<Order | null>
  update(reference: string, changes: Pick<Order, 'status' | 'payment'>): Promise<void>
}
