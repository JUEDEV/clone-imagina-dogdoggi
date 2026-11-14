import { useEffect, useState } from "react";
import { useStore } from "@nanostores/react";
import { Minus, Plus, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  $cartItems,
  $isCartOpen,
  $subtotal,
  $totalItems,
  isAtLimit,
  removeFromCart,
  updateQuantity,
} from "@/stores/cart";
import { money } from "@/lib/money";

/**
 * Isla: botón del carrito con su contador + panel lateral (Radix Sheet, focus
 * trap). Es isla porque el carrito vive en localStorage y cualquier botón
 * "Agregar" lo abre vía `$isCartOpen` (nanostores, sin contexto de React).
 */
export default function CartDrawer() {
  const items = useStore($cartItems);
  const open = useStore($isCartOpen);
  const count = useStore($totalItems);
  const subtotal = useStore($subtotal);
  // El carrito sale de localStorage: hasta montar se pinta vacío para no
  // romper la hidratación (el servidor no lo conoce).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const shownCount = mounted ? count : 0;

  return (
    <>
      <button
        type="button"
        onClick={() => $isCartOpen.set(true)}
        aria-label={`Carrito de compras${shownCount ? `, ${shownCount} productos` : ""}`}
        className="relative inline-grid size-11 place-items-center rounded-full transition-[background,color,transform] duration-200 hover:bg-white/35 active:scale-95"
      >
        <ShoppingBag className="size-[22px]" />
        {shownCount > 0 && (
          <span className="absolute -top-px -right-px grid h-[19px] min-w-[19px] place-items-center rounded-full border-2 border-white bg-orange px-1 text-[10px] font-extrabold text-white">
            {shownCount}
          </span>
        )}
      </button>

      <Sheet open={open} onOpenChange={(value) => $isCartOpen.set(value)}>
        <SheetContent side="right" className="w-[min(440px,100vw)] gap-0 bg-paper p-0 text-navy sm:max-w-[440px]">
          <div className="flex items-center gap-3 border-b border-line px-5 py-4">
            <SheetTitle className="text-xl font-semibold text-navy">Tu carrito</SheetTitle>
            {mounted && count > 0 && (
              <span className="rounded-full bg-mint px-2.5 py-0.5 text-xs font-extrabold text-turquoise-dark">{count}</span>
            )}
          </div>

          {!mounted || items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
              <span className="grid size-16 place-items-center rounded-full bg-mint text-turquoise-dark">
                <ShoppingBag className="size-7" />
              </span>
              <p className="font-display text-xl font-semibold">Tu carrito está vacío</p>
              <p className="text-sm text-ink-soft">Agrega herramientas y productos para tu peluquería.</p>
              <a
                href="/productos"
                onClick={() => $isCartOpen.set(false)}
                className="mt-2 inline-flex min-h-12 items-center gap-2 rounded-[13px] bg-orange px-5 font-extrabold text-white hover:bg-orange-dark"
              >
                Ver productos <ArrowRight className="size-[18px]" />
              </a>
            </div>
          ) : (
            <>
              <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
                {items.map((item) => (
                  <li key={item.id} className="grid grid-cols-[72px_1fr] gap-3.5 py-4">
                    <a href={`/productos/${item.slug}`} className="block size-[72px] overflow-hidden rounded-xl bg-surface">
                      <img src={item.image} alt="" className="size-full object-contain mix-blend-multiply" loading="lazy" />
                    </a>
                    <div className="min-w-0">
                      <a href={`/productos/${item.slug}`} className="line-clamp-2 text-sm leading-snug font-bold hover:text-orange-dark">
                        {item.name}
                      </a>
                      <p className="mt-0.5 text-xs text-ink-soft">{money(item.price)} c/u</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <QuantityControl
                          value={item.quantity}
                          atLimit={isAtLimit(item)}
                          onChange={(q) => updateQuantity(item.id, q)}
                          label={item.name}
                        />
                        <strong className="text-sm font-extrabold">{money(item.price * item.quantity)}</strong>
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        {isAtLimit(item) && item.maxQuantity !== null ? (
                          <span className="text-[11px] font-bold text-orange-dark">Máximo disponible alcanzado</span>
                        ) : (
                          <span />
                        )}
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="inline-flex min-h-9 items-center gap-1 text-xs font-bold text-ink-soft hover:text-[#a21b13]"
                        >
                          <Trash2 className="size-3.5" /> Eliminar
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="border-t border-line bg-mint/60 px-5 py-4">
                <div className="flex items-baseline justify-between">
                  <span className="font-bold">Subtotal ({count} {count === 1 ? "producto" : "productos"})</span>
                  <strong className="text-xl font-extrabold">{money(subtotal)}</strong>
                </div>
                <p className="mt-1 text-xs text-ink-soft">El envío se calcula al finalizar la compra.</p>
                <a
                  href="/checkout"
                  className="mt-4 flex min-h-[52px] items-center justify-center gap-2 rounded-[13px] bg-orange font-extrabold text-white transition-colors hover:bg-orange-dark"
                >
                  Finalizar compra <ArrowRight className="size-[18px]" />
                </a>
                <a
                  href="/carrito"
                  className="mt-2 flex min-h-11 items-center justify-center rounded-[13px] border-2 border-navy text-sm font-extrabold transition-colors hover:bg-navy hover:text-white"
                >
                  Ver carrito
                </a>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

export function QuantityControl({
  value,
  onChange,
  atLimit,
  label,
  size = "sm",
}: {
  value: number;
  onChange: (value: number) => void;
  atLimit: boolean;
  label: string;
  size?: "sm" | "lg";
}) {
  const box = size === "lg" ? "size-12" : "size-9";
  return (
    <div className="inline-flex items-center rounded-[11px] border border-line bg-white" role="group" aria-label={`Cantidad de ${label}`}>
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        aria-label="Quitar una unidad"
        className={`${box} grid place-items-center disabled:opacity-35`}
      >
        <Minus className="size-4" />
      </button>
      <span className="min-w-8 text-center text-sm font-extrabold" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={atLimit}
        aria-label="Agregar una unidad"
        className={`${box} grid place-items-center disabled:opacity-35`}
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
