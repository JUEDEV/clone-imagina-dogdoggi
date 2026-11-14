import type { APIRoute } from 'astro'
import { MailNotConfiguredError, submitContact, validateContact } from '@/lib/forms/contact'

// Recibe el formulario de /contacto (JSON) y avisa a la tienda por correo.
export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  let raw: Record<string, unknown>
  try {
    raw = await request.json()
  } catch {
    return Response.json({ error: 'Solicitud inválida.' }, { status: 400 })
  }

  // Honeypot: los bots llenan el campo oculto; se responde "ok" sin enviar nada.
  if (String(raw.website ?? '').trim()) return Response.json({ ok: true })

  const result = validateContact(raw)
  if ('errors' in result) return Response.json({ errors: result.errors }, { status: 422 })

  try {
    await submitContact(result.data, request.headers.get('referer'))
    return Response.json({ ok: true })
  } catch (error) {
    // Nunca se exponen detalles del SMTP al navegador.
    const notConfigured = error instanceof MailNotConfiguredError
    console.error('[contacto] no se pudo enviar el mensaje', error instanceof Error ? error.message : error)
    return Response.json({ error: notConfigured ? 'not_configured' : 'send_failed' }, { status: notConfigured ? 503 : 502 })
  }
}
