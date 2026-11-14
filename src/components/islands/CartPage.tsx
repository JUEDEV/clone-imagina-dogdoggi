import { useStore } from "@nanostores/react";
import { ArrowRight, ShoppingBag, Trash2 } from "lucide-react";
import { $cartItems, $subtotal, $totalItems, clearCart, isAtLimit, removeFromCart, updateQuantity } from "@/stores/cart";
import { money } from "@/lib/money";
import { QuantityControl } from "./CartDrawer";

/**
 * Isla: página del carrito. Se monta con client:only porque el carrito solo
 * existe en el navegador (localStorage): no hay nada que pintar en el servidor.
 */
export default function CartPage() {
  const items = useStore($cartItems);
  const subtotal = useStore($subtotal);
  const count = useStore($totalItems);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[22px] border border-dashed border-line px-6 py-16 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-mint text-turquoise-dark">
          <ShoppingBag className="size-7" />
        </span>
        <p className="font-display text-2xl font-semibold">Tu carrito está vacío</p>
        <p className="text-ink-soft">Explora el catálogo y agrega lo que necesita tu peluquería.</p>
        <a href="/productos" className="mt-2 inline-flex min-h-12 items-center gap-2 rounded-[13px] bg-orange px-6 font-extrabold text-white hover:bg-orange-dark">
          Ver productos <ArrowRight className="size-[18px]" />
        </a>
      </div>
    );
  }

  return (
    <div className="grid items-start gap-6 md:grid-cols-[1fr_340px] desk:grid-cols-[1fr_380px] desk:gap-9">
      <ul className="divide-y divide-line rounded-[22px] border border-line bg-paper px-4 md:px-6">
        {items.map((item) => (
          <li key={item.id} className="grid grid-cols-[84px_1fr] gap-4 py-5 md:grid-cols-[110px_1fr_auto] md:items-center">
            <a href={`/productos/${item.slug}`} className="block size-[84px] overflow-hidden rounded-2xl bg-surface md:size-[110px]">
              <img src={item.image} alt="" className="size-full object-contain mix-blend-multiply" />
            </a>
            <div className="min-w-0">
              <a href={`/productos/${item.slug}`} className="text-base leading-snug font-bold hover:text-orange-dark">
                {item.name}
              </a>
              <p className="mt-0.5 text-sm text-ink-soft">{money(item.price)} c/u</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <QuantityControl value={item.quantity} atLimit={isAtLimit(item)} onChange={(q) => updateQuantity(item.id, q)} label={item.name} />
                <button
                  type="button"
                  onClick={() => removeFromCart(item.id)}
                  className="inline-flex min-h-10 items-center gap-1.5 text-sm font-bold text-ink-soft hover:text-[#a21b13]"
                >
                  <Trash2 className="size-4" /> Eliminar
                </button>
              </div>
              {isAtLimit(item) && item.maxQuantity !== null && (
                <p className="mt-1.5 text-xs font-bold text-orange-dark">Alcanzaste las unidades disponibles de este producto.</p>
              )}
            </div>
            <strong className="col-start-2 text-lg font-extrabold md:col-start-auto md:text-right">{money(item.price * item.quantity)}</strong>
          </li>
        ))}
      </ul>

      <aside className="rounded-[22px] border border-line bg-mint/70 p-5 md:sticky md:top-4 md:p-6" aria-label="Resumen del pedido">
        <h2 className="mb-4 text-2xl font-semibold">Resumen</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt>Productos</dt>
            <dd className="font-bold">{count}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd className="font-bold">{money(subtotal)}</dd>
          </div>
          <div className="flex justify-between text-ink-soft">
            <dt>Envío</dt>
            <dd>Se calcula en el siguiente paso</dd>
          </div>
        </dl>
        <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
          <span className="font-bold">Total</span>
          <strong className="text-2xl font-extrabold">{money(subtotal)}</strong>
        </div>
        <a
          href="/checkout"
          className="mt-5 flex min-h-[52px] items-center justify-center gap-2 rounded-[13px] bg-orange font-extrabold text-white transition-colors hover:bg-orange-dark"
        >
          Finalizar compra <ArrowRight className="size-[18px]" />
        </a>
        <a href="/productos" className="mt-2 flex min-h-11 items-center justify-center text-sm font-extrabold hover:text-orange-dark">
          Seguir comprando
        </a>
        <button type="button" onClick={clearCart} className="mt-1 flex min-h-10 w-full items-center justify-center text-xs font-bold text-ink-soft hover:text-[#a21b13]">
          Vaciar carrito
        </button>
      </aside>
    </div>
  );
}
