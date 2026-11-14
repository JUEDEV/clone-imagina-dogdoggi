// Opciones del campo "Tipo de consulta". El servidor valida contra esta misma lista.
export const CONTACT_TOPICS = [
  'Asesoría sobre productos',
  'Pedido o compra',
  'Perfect Groom',
  'Garantía y repuestos',
  'Otro',
] as const

export type ContactTopic = (typeof CONTACT_TOPICS)[number]

// TODO: enlazar la página de política de tratamiento de datos cuando exista.
export const PRIVACY_POLICY_URL = '#politica-datos'
