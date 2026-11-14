import { useState, type ReactNode } from "react";
import { ArrowRight, ChevronDown, ChevronRight, Menu } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { NavItem, ShopMenuItem } from "@/data/site";
import { cn } from "@/lib/utils";

/**
 * Isla: menú lateral móvil (Radix Sheet, con focus trap). Se hidrata solo en
 * pantallas < md (client:media en Header.astro). El submenú de la tienda se
 * despliega en acordeón; el CTA de WhatsApp llega como slot `cta` desde Astro.
 */
interface MobileMenuProps {
  before: NavItem[];
  shopLabel: string;
  shop: ShopMenuItem[];
  after: NavItem[];
  note?: string;
  cta?: ReactNode;
}

const linkClass =
  "flex min-h-[54px] w-full items-center justify-between border-b border-line text-left font-extrabold";
const external = (item: NavItem) => (item.external ? { target: "_blank", rel: "noopener noreferrer" } : {});

export default function MobileMenu({ before, shopLabel, shop, after, note, cta }: MobileMenuProps) {
  const [shopOpen, setShopOpen] = useState(false);
  const [openItem, setOpenItem] = useState<string | null>(null);

  const navLink = (item: NavItem) => (
    <SheetClose asChild key={item.label}>
      <a href={item.href} {...external(item)} className={cn(linkClass, item.highlight && "text-pg-ink")}>
        {item.label}
        {item.highlight ? <ArrowRight className="size-5" /> : <ChevronRight className="size-5" />}
      </a>
    </SheetClose>
  );

  return (
    <Sheet>
      <SheetTrigger className="grid size-11 place-items-center md:hidden" aria-label="Abrir menú">
        <Menu className="size-6" />
      </SheetTrigger>
      <SheetContent side="left" className="w-[min(360px,90vw)] gap-0 overflow-y-auto bg-paper p-5 text-navy">
        <SheetTitle className="sr-only">Menú</SheetTitle>
        <img
          src="/images/brand/dog-doggi-logo.webp"
          alt="Dog Doggi"
          width={600}
          height={245}
          className="mb-[25px] h-[70px] w-[150px] object-contain"
        />
        <nav className="flex flex-col" aria-label="Navegación móvil">
          {before.map(navLink)}

          <button
            type="button"
            onClick={() => setShopOpen((v) => !v)}
            className={linkClass}
            aria-expanded={shopOpen}
          >
            {shopLabel}
            <ChevronDown className={cn("size-5 transition-transform duration-300", shopOpen && "rotate-180")} />
          </button>
          <div
            className={cn("overflow-hidden transition-all duration-300", shopOpen ? "max-h-[1400px]" : "max-h-0")}
            inert={!shopOpen}
          >
            <ul className="py-1 pl-3">
              {shop.map((item) =>
                item.children ? (
                  <li key={item.href}>
                    <button
                      type="button"
                      onClick={() => setOpenItem((v) => (v === item.href ? null : item.href))}
                      aria-expanded={openItem === item.href}
                      className="flex min-h-11 w-full items-center justify-between text-left text-sm font-bold"
                    >
                      {item.label}
                      <ChevronDown className={cn("size-4 transition-transform duration-300", openItem === item.href && "rotate-180")} />
                    </button>
                    <ul
                      className={cn("overflow-hidden border-l-2 border-turquoise pl-3 transition-all duration-300", openItem === item.href ? "max-h-[600px]" : "max-h-0")}
                      inert={openItem !== item.href}
                    >
                      {[...item.children, { label: `Ver todo en ${item.label}`, href: item.href }].map((child, i, all) => (
                        <li key={child.href}>
                          <SheetClose asChild>
                            <a href={child.href} className={cn("flex min-h-11 items-center text-sm text-ink-soft", i === all.length - 1 && "font-extrabold text-orange-dark")}>
                              {child.label}
                            </a>
                          </SheetClose>
                        </li>
                      ))}
                    </ul>
                  </li>
                ) : (
                  <li key={item.href}>
                    <SheetClose asChild>
                      <a href={item.href} className="flex min-h-11 items-center text-sm font-bold">
                        {item.label}
                      </a>
                    </SheetClose>
                  </li>
                ),
              )}
            </ul>
          </div>

          {after.map(navLink)}
        </nav>

        {note && <p className="mt-[30px] text-[13px] text-ink-soft">{note}</p>}
        {cta && <div className="mt-auto pt-6">{cta}</div>}
      </SheetContent>
    </Sheet>
  );
}
