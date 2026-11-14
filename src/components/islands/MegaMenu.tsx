import { useState, type ReactNode } from "react";
import { ArrowRight, ChevronRight } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import type { ShopMenuItem } from "@/data/site";
import { cn } from "@/lib/utils";

/**
 * Isla: menú Tienda del header de escritorio (Radix NavigationMenu: abre con
 * hover y teclado, cierra con Escape). Como la referencia del cliente: lista
 * vertical de categorías; al pasar el mouse (o enfocar) una con subcategorías,
 * estas aparecen al lado. Sin subcategorías se ve el banner `featured` (slot de Astro).
 * El panel se ancla bajo el trigger (`viewport={false}`); las clases con `!`
 * pisan las del modo sin viewport de shadcn sin editar components/ui.
 */
interface MegaMenuProps {
  label: string;
  items: ShopMenuItem[];
  featured?: ReactNode;
}

export default function MegaMenu({ label, items, featured }: MegaMenuProps) {
  const [active, setActive] = useState<number | null>(null);
  const current = active === null ? undefined : items[active];

  return (
    <NavigationMenu viewport={false} onValueChange={(value) => !value && setActive(null)}>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="h-auto min-h-11 gap-0.5 rounded-none bg-transparent px-0 py-0 text-sm font-extrabold hover:bg-transparent hover:text-orange focus:bg-transparent data-[state=open]:bg-transparent data-[state=open]:text-orange data-[state=open]:hover:bg-transparent data-[state=open]:focus:bg-transparent [&>svg]:size-4">
            {label}
          </NavigationMenuTrigger>
          <NavigationMenuContent className="left-1/2 z-30 grid w-[min(760px,85vw)]! -translate-x-[30%] grid-cols-[270px_1fr] mt-0! overflow-hidden rounded-[0_0_22px_22px]! border-line! bg-paper! p-0! text-navy! shadow-[0_24px_45px_rgba(5,28,72,0.16)]!">
            <ul
              className="list-none border-r border-line py-2"
              // Al salir de una categoría sin subcategorías vuelve el banner; con subcategorías
              // se mantiene abierta para poder llegar a ellas.
              onMouseLeave={() => {
                if (!current?.children) setActive(null);
              }}
            >
              {items.map((item, i) => (
                <li key={item.href}>
                  <NavigationMenuLink
                    href={item.href}
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    aria-haspopup={item.children ? "true" : undefined}
                    className={cn(
                      "flex min-h-[42px] flex-row items-center justify-between gap-2 rounded-none border-b border-line/70 px-5 py-2 text-sm font-bold transition-colors last:border-b-0 hover:bg-mint hover:text-navy focus:bg-mint",
                      active === i && "bg-mint",
                    )}
                  >
                    {item.label}
                    <ChevronRight className={cn("size-4 shrink-0 text-ink-soft", !item.children && "opacity-0")} />
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>

            <div className="min-h-full p-6">
              {current?.children ? (
                <div>
                  <ul className="grid list-none gap-0.5">
                    {current.children.map((child) => (
                      <li key={child.href}>
                        <NavigationMenuLink
                          href={child.href}
                          className="block min-h-10 rounded-lg px-2 py-2.5 text-sm hover:bg-transparent hover:text-orange-dark focus:bg-mint"
                        >
                          {child.label}
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                  <NavigationMenuLink
                    href={current.href}
                    className="mt-3 inline-flex min-h-10 flex-row items-center gap-1.5 rounded-lg px-2 text-sm font-extrabold text-orange-dark hover:bg-transparent hover:underline focus:bg-mint"
                  >
                    Ver todo en {current.label} <ArrowRight className="size-4 text-orange-dark" />
                  </NavigationMenuLink>
                </div>
              ) : (
                featured
              )}
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
