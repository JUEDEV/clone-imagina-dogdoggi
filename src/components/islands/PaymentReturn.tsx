import { useEffect, useState } from "react";
import { CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";
import { clearCart } from "@/stores/cart";

/**
 * Isla: espera la confirmación del pago. Consulta /api/payments/status cada 3 s
 * (20 intentos si Wompi devolvió el id de la transacción; 100 si no, porque el
 * pago se está haciendo en otra pestaña). Al aprobarse vacía el carrito y va a
 * /checkout/gracias.
 */
interface PaymentReturnProps {
  reference: string;
  transactionId: string;
  whatsappUrl: string;
}

type Outcome = "pending" | "approved" | "declined" | "timeout";

export default function PaymentReturn({ reference, transactionId, whatsappUrl }: PaymentReturnProps) {
  const [outcome, setOutcome] = useState<Outcome>("pending");

  useEffect(() => {
    const maxAttempts = transactionId ? 20 : 100;
    let attempts = 0;
    let timer: number | undefined;
    let stopped = false;

    const poll = async () => {
      attempts++;
      try {
        const query = new URLSearchParams({ ref: reference, ...(transactionId ? { id: transactionId } : {}) });
        const response = await fetch(`/api/payments/status?${query}`, { cache: "no-store" });
        const data = (await response.json()) as { outcome?: string };
        if (stopped) return;
        if (data.outcome === "approved") {
          setOutcome("approved");
          clearCart();
          timer = window.setTimeout(() => (window.location.href = `/checkout/gracias?ref=${encodeURIComponent(reference)}`), 1200);
          return;
        }
        if (data.outcome === "declined") {
          setOutcome("declined");
          return;
        }
      } catch {
        // Error de red: se reintenta.
      }
      if (attempts >= maxAttempts) setOutcome("timeout");
      else timer = window.setTimeout(poll, 3000);
    };

    poll();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, [reference, transactionId]);

  const box = "flex flex-col items-center gap-3 rounded-[22px] border border-line bg-paper px-6 py-14 text-center";
  return (
    <div aria-live="polite">
      {outcome === "pending" && (
        <div className={box}>
          <LoaderCircle className="size-12 animate-spin text-turquoise-dark motion-reduce:animate-none" />
          <h1 className="text-3xl font-semibold">Confirmando tu pago…</h1>
          <p className="max-w-md text-ink-soft">
            {transactionId
              ? "Estamos verificando la transacción con Wompi. No cierres esta página."
              : "Completa el pago en la pestaña de Wompi; esta página se actualiza sola cuando se confirme."}
          </p>
          <p className="text-sm text-ink-soft">Pedido {reference}</p>
        </div>
      )}
      {outcome === "approved" && (
        <div className={box}>
          <CircleCheck className="size-12 text-[#1f9d55]" />
          <h1 className="text-3xl font-semibold">¡Pago aprobado!</h1>
          <p className="text-ink-soft">Te llevamos al resumen de tu pedido…</p>
        </div>
      )}
      {outcome === "declined" && (
        <div className={box}>
          <CircleAlert className="size-12 text-[#a21b13]" />
          <h1 className="text-3xl font-semibold">El pago no fue aprobado</h1>
          <p className="max-w-md text-ink-soft">Tu carrito sigue guardado. Puedes intentarlo de nuevo con otro medio de pago.</p>
          <a href="/checkout" className="mt-2 inline-flex min-h-12 items-center rounded-[13px] bg-orange px-6 font-extrabold text-white hover:bg-orange-dark">
            Intentar de nuevo
          </a>
        </div>
      )}
      {outcome === "timeout" && (
        <div className={box}>
          <CircleAlert className="size-12 text-orange-dark" />
          <h1 className="text-3xl font-semibold">Tu pago sigue en proceso</h1>
          <p className="max-w-md text-ink-soft">
            Algunos pagos (como PSE) tardan unos minutos. Te confirmaremos por correo; si tienes dudas, escríbenos con tu número de pedido{" "}
            <strong>{reference}</strong>.
          </p>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-12 items-center rounded-[13px] border-2 border-navy px-6 font-extrabold hover:bg-navy hover:text-white">
            Escribir por WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}
