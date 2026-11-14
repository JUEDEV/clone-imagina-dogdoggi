import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { addToCart, openCart } from "@/stores/cart";
import type { CartProduct } from "@/lib/cart/types";
import { cn } from "@/lib/utils";
import { QuantityControl } from "./CartDrawer";

/**
 * Isla: "Agregar al carrito". En tarjetas es solo el botón; en la ficha
 * (`withQuantity`) suma el selector de cantidad. Agrega al store y abre el
 * panel del carrito como confirmación.
 * El aspecto llega por `className` para que cada tarjeta lo estilice sin tocar la isla.
 */
interface AddToCartProps {
  product: CartProduct;
  withQuantity?: boolean;
  label?: string;
  soldOutLabel?: string;
  className?: string;
  /** Oculta el ícono en tarjetas muy angostas. */
  iconClassName?: string;
}

export default function AddToCart({
  product,
  withQuantity = false,
  label = "Agregar al carrito",
  soldOutLabel = "Agotado",
  className,
  iconClassName,
}: AddToCartProps) {
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const soldOut = product.maxQuantity !== null && product.maxQuantity <= 0;
  const limit = product.maxQuantity ?? 99;

  const add = () => {
    const result = addToCart(product, quantity);
    if (result.added) {
      setMessage("");
      setQuantity(1);
      openCart();
    } else {
      setMessage(result.reason ?? "");
    }
  };

  const button = (
    <button type="button" onClick={add} disabled={soldOut} className={cn("disabled:cursor-not-allowed disabled:opacity-55", className)}>
      <ShoppingBag className={cn("size-[17px] shrink-0", iconClassName)} />
      {soldOut ? soldOutLabel : label}
    </button>
  );

  if (!withQuantity) return button;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {!soldOut && (
          <QuantityControl value={quantity} onChange={(q) => setQuantity(Math.max(1, Math.min(limit, q)))} atLimit={quantity >= limit} label={product.name} size="lg" />
        )}
        {button}
      </div>
      {!soldOut && product.maxQuantity !== null && (
        <p className="mt-2 text-xs text-ink-soft">
          Puedes agregar hasta {product.maxQuantity} {product.maxQuantity === 1 ? "unidad" : "unidades"} en esta compra.
        </p>
      )}
      <p className="mt-1 text-xs font-bold text-orange-dark empty:hidden" aria-live="polite">
        {message}
      </p>
    </div>
  );
}
