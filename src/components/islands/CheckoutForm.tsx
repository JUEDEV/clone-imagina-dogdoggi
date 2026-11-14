import { useMemo, useState, type ReactNode } from "react";
import { useStore } from "@nanostores/react";
import { ArrowRight, LoaderCircle, Lock, ShoppingBag } from "lucide-react";
import { $cartItems, $subtotal } from "@/stores/cart";
import { COLOMBIA_DEPARTMENTS, getCitiesForDepartment } from "@/data/colombia-locations";
import { EMPTY_CHECKOUT_FORM, validateCheckoutForm, type CheckoutErrors, type CheckoutFormValues } from "@/lib/checkout/form";
import type { ShippingOption } from "@/lib/checkout/shipping";
import { money } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * Isla: checkout en una sola página (datos, entrega, resumen). client:only
 * porque depende del carrito en localStorage. Valida con las mismas reglas que
 * el servidor (lib/checkout/form.ts); el servidor recalcula precios y stock,
 * crea el pedido y devuelve la URL de pago (Wompi o el simulador en desarrollo).
 */
interface CheckoutFormProps {
  shippingOptions: ShippingOption[];
  paymentMode: "wompi" | "mock" | "disabled";
  privacyUrl: string;
  whatsappUrl: string;
}

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "error"; message: string } | { kind: "redirecting"; url: string; tab: boolean };

export default function CheckoutForm({ shippingOptions, paymentMode, privacyUrl, whatsappUrl }: CheckoutFormProps) {
  const items = useStore($cartItems);
  const subtotal = useStore($subtotal);
  const [values, setValues] = useState<CheckoutFormValues>({ ...EMPTY_CHECKOUT_FORM, delivery: shippingOptions[0]?.code ?? "" });
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const delivery = shippingOptions.find((o) => o.code === values.delivery);
  const shipping = delivery?.price ?? 0;
  const cities = useMemo(() => getCitiesForDepartment(values.province), [values.province]);

  const set = <K extends keyof CheckoutFormValues>(key: K, value: CheckoutFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value, ...(key === "province" ? { city: "" } : {}) }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    if (status.kind === "error") setStatus({ kind: "idle" });
  };

  const focusFirst = (next: CheckoutErrors) => {
    const first = Object.keys(next)[0];
    if (first) setTimeout(() => document.querySelector<HTMLElement>(`[name="${first}"]`)?.focus(), 0);
  };

  const submit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    if (status.kind === "sending") return;
    const check = validateCheckoutForm(values, shippingOptions);
    if (!check.ok) {
      setErrors(check.errors);
      focusFirst(check.errors);
      return;
    }
    setStatus({ kind: "sending" });
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: items.map((i) => ({ id: i.id, quantity: i.quantity })), form: values }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        errors?: CheckoutErrors;
        redirect_url?: string;
        status_url?: string;
      };
      if (!response.ok || !data.redirect_url) {
        if (data.errors) {
          setErrors(data.errors);
          focusFirst(data.errors);
        }
        setStatus({ kind: "error", message: data.error ?? "No pudimos procesar tu pedido. Intenta de nuevo." });
        return;
      }
      // Sin dominio público (local) Wompi no puede volver: se paga en otra pestaña y aquí se consulta el estado.
      if (data.status_url) {
        window.open(data.redirect_url, "_blank", "noopener");
        setStatus({ kind: "redirecting", url: data.redirect_url, tab: true });
        window.location.href = data.status_url;
        return;
      }
      setStatus({ kind: "redirecting", url: data.redirect_url, tab: false });
      window.location.href = data.redirect_url;
    } catch {
      setStatus({ kind: "error", message: "Revisa tu conexión e intenta de nuevo." });
    }
  };

  if (items.length === 0 && status.kind !== "redirecting") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[22px] border border-dashed border-line px-6 py-16 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-mint text-turquoise-dark">
          <ShoppingBag className="size-7" />
        </span>
        <p className="font-display text-2xl font-semibold">Tu carrito está vacío</p>
        <a href="/productos" className="mt-2 inline-flex min-h-12 items-center gap-2 rounded-[13px] bg-orange px-6 font-extrabold text-white hover:bg-orange-dark">
          Ver productos <ArrowRight className="size-[18px]" />
        </a>
      </div>
    );
  }

  const input = (name: keyof CheckoutFormValues, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, required = true) => (
    <Field name={name} label={label} required={required} error={errors[name]}>
      <input
        id={`co-${name}`}
        name={name}
        value={values[name] as string}
        onChange={(e) => set(name, e.target.value as never)}
        aria-invalid={Boolean(errors[name])}
        aria-describedby={errors[name] ? `co-${name}-error` : undefined}
        className="form-control"
        {...props}
      />
    </Field>
  );

  return (
    <form onSubmit={submit} noValidate className="grid items-start gap-6 md:grid-cols-[1fr_340px] desk:grid-cols-[1fr_400px] desk:gap-9">
      <div className="space-y-6">
        {paymentMode === "mock" && (
          <p className="rounded-2xl border border-[#f1d38a] bg-[#fff8e5] px-4 py-3 text-sm text-[#6b4d00]">
            <strong>Modo de prueba:</strong> no hay llaves de Wompi configuradas. El pago se simula y no se cobra nada.
          </p>
        )}

        <Panel step={1} title="Tus datos">
          <div className="grid gap-x-4 sm:grid-cols-2">
            {input("first_name", "Nombre", { autoComplete: "given-name" })}
            {input("last_name", "Apellido", { autoComplete: "family-name" })}
            {input("email", "Correo electrónico", { type: "email", inputMode: "email", autoComplete: "email", placeholder: "tu@correo.com" })}
            {input("phone", "Celular", { type: "tel", inputMode: "numeric", autoComplete: "tel-national", maxLength: 10, placeholder: "300 000 0000" })}
            {input("identification_number", "Cédula", { inputMode: "numeric", maxLength: 10, placeholder: "Para la factura y el pago" })}
          </div>
        </Panel>

        <Panel step={2} title="Entrega">
          <fieldset>
            <legend className="sr-only">¿Cómo quieres recibir tu pedido?</legend>
            <div className="grid gap-2.5">
              {shippingOptions.map((option) => (
                <label
                  key={option.code}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition-colors",
                    values.delivery === option.code ? "border-navy bg-mint/60" : "border-line hover:border-[#9fb1bd]",
                  )}
                >
                  <input
                    type="radio"
                    name="delivery"
                    value={option.code}
                    checked={values.delivery === option.code}
                    onChange={() => set("delivery", option.code)}
                    className="mt-1 size-[18px] accent-navy"
                  />
                  <span className="flex-1">
                    <span className="flex flex-wrap items-baseline justify-between gap-2">
                      <strong className="font-extrabold">{option.label}</strong>
                      <span className="text-sm font-extrabold">{option.price > 0 ? money(option.price) : option.pickup ? "Gratis" : "Contra entrega"}</span>
                    </span>
                    {option.description && <span className="mt-0.5 block text-sm text-ink-soft">{option.description}</span>}
                  </span>
                </label>
              ))}
            </div>
            <FieldError name="delivery" error={errors.delivery} />
          </fieldset>

          {delivery && !delivery.pickup && (
            <div className="mt-5 grid gap-x-4 sm:grid-cols-2">
              <div className="sm:col-span-2">{input("address_1", "Dirección", { autoComplete: "address-line1", placeholder: "Calle, carrera, número" })}</div>
              <div className="sm:col-span-2">
                {input("address_2", "Apartamento, local o barrio", { autoComplete: "address-line2" }, false)}
              </div>
              <Field name="province" label="Departamento" required error={errors.province}>
                <select
                  id="co-province"
                  name="province"
                  value={values.province}
                  onChange={(e) => set("province", e.target.value)}
                  aria-invalid={Boolean(errors.province)}
                  className="form-control"
                >
                  <option value="">Selecciona un departamento</option>
                  {COLOMBIA_DEPARTMENTS.map((d) => (
                    <option key={d.department}>{d.department}</option>
                  ))}
                </select>
              </Field>
              <Field name="city" label="Ciudad" required error={errors.city}>
                <select
                  id="co-city"
                  name="city"
                  value={values.city}
                  onChange={(e) => set("city", e.target.value)}
                  disabled={!values.province}
                  aria-invalid={Boolean(errors.city)}
                  className="form-control disabled:opacity-60"
                >
                  <option value="">{values.province ? "Selecciona una ciudad" : "Primero elige el departamento"}</option>
                  {cities.map((city) => (
                    <option key={city}>{city}</option>
                  ))}
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field name="notes" label="Indicaciones para la entrega" error={errors.notes}>
                  <textarea
                    id="co-notes"
                    name="notes"
                    rows={2}
                    value={values.notes}
                    onChange={(e) => set("notes", e.target.value)}
                    className="form-control min-h-[84px] resize-y"
                    placeholder="Opcional"
                  />
                </Field>
              </div>
            </div>
          )}
        </Panel>
      </div>

      <aside className="rounded-[22px] border border-line bg-paper p-5 shadow-[0_16px_45px_rgba(5,28,72,0.055)] md:sticky md:top-4 md:p-6" aria-label="Resumen del pedido">
        <h2 className="mb-4 text-2xl font-semibold">Tu pedido</h2>
        <ul className="max-h-[320px] space-y-3 overflow-y-auto pr-1">
          {items.map((item) => (
            <li key={item.id} className="grid grid-cols-[56px_1fr_auto] items-center gap-3 text-sm">
              <span className="relative block size-14 rounded-xl bg-surface">
                <img src={item.image} alt="" className="size-full object-contain mix-blend-multiply" />
                <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-navy text-[11px] font-extrabold text-white">
                  {item.quantity}
                </span>
              </span>
              <span className="line-clamp-2 font-bold">{item.name}</span>
              <span className="font-extrabold">{money(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd className="font-bold">{money(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Envío</dt>
            <dd className="font-bold">{shipping > 0 ? money(shipping) : delivery?.pickup ? "Gratis" : "Contra entrega"}</dd>
          </div>
        </dl>
        <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
          <span className="font-bold">Total a pagar</span>
          <strong className="text-2xl font-extrabold">{money(subtotal + shipping)}</strong>
        </div>

        <label className="mt-5 flex cursor-pointer items-start gap-2.5 text-sm leading-normal">
          <input
            type="checkbox"
            name="privacy"
            checked={values.privacy}
            onChange={(e) => set("privacy", e.target.checked)}
            aria-invalid={Boolean(errors.privacy)}
            aria-describedby={errors.privacy ? "co-privacy-error" : undefined}
            className="mt-0.5 size-5 shrink-0 accent-turquoise-dark"
          />
          <span>
            Acepto la{" "}
            <a href={privacyUrl} className="underline underline-offset-2 hover:text-orange-dark">
              política de tratamiento de datos personales
            </a>
          </span>
        </label>
        <FieldError name="privacy" error={errors.privacy} />

        <button
          type="submit"
          disabled={status.kind === "sending" || status.kind === "redirecting" || paymentMode === "disabled"}
          className="mt-5 flex min-h-[54px] w-full items-center justify-center gap-2 rounded-[13px] bg-orange font-extrabold text-white transition-colors hover:bg-orange-dark disabled:cursor-wait disabled:opacity-75"
        >
          {status.kind === "sending" || status.kind === "redirecting" ? (
            <>
              <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" /> {status.kind === "sending" ? "Creando tu pedido…" : "Abriendo el pago…"}
            </>
          ) : (
            <>
              <Lock className="size-[18px]" /> Pagar {money(subtotal + shipping)}
            </>
          )}
        </button>
        <p className="mt-2.5 text-center text-xs text-ink-soft">Pago seguro con Wompi: PSE, tarjetas, Nequi y más.</p>

        <div aria-live="assertive">
          {status.kind === "error" && (
            <p className="mt-4 rounded-[11px] border border-[#f0c3bd] bg-[#fff0ee] px-4 py-3 text-sm text-[#8d2018]" role="alert">
              {status.message}{" "}
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="font-extrabold underline">
                Escríbenos por WhatsApp
              </a>
            </p>
          )}
          {paymentMode === "disabled" && (
            <p className="mt-4 rounded-[11px] border border-[#f0c3bd] bg-[#fff0ee] px-4 py-3 text-sm text-[#8d2018]">
              Los pagos en línea no están disponibles en este momento. Escríbenos por WhatsApp para completar tu compra.
            </p>
          )}
          {status.kind === "redirecting" && (
            <p className="mt-4 text-center text-sm">
              Si no se abre la pasarela,{" "}
              <a href={status.url} className="font-extrabold underline">
                continúa el pago aquí
              </a>
              .
            </p>
          )}
        </div>
      </aside>
    </form>
  );
}

function Panel({ step, title, children }: { step: number; title: string; children: ReactNode }) {
  return (
    <section className="rounded-[22px] border border-line bg-paper p-5 md:p-7">
      <h2 className="mb-5 flex items-center gap-3 text-[22px] font-semibold md:text-2xl">
        <span className="grid size-8 place-items-center rounded-full bg-turquoise text-base font-extrabold text-navy">{step}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({ name, label, required, error, children }: { name: string; label: string; required?: boolean; error?: string; children: ReactNode }) {
  return (
    <div className="mb-4" data-invalid={error ? "" : undefined}>
      <label htmlFor={`co-${name}`} className="mb-1.5 block text-sm font-extrabold">
        {label} {required && <span className="text-orange-dark" aria-hidden="true">*</span>}
      </label>
      {children}
      <FieldError name={name} error={error} />
    </div>
  );
}

function FieldError({ name, error }: { name: string; error?: string }) {
  return error ? (
    <span id={`co-${name}-error`} className="mt-1.5 block text-[13px] font-bold text-[#a21b13]" role="alert">
      {error}
    </span>
  ) : null;
}
