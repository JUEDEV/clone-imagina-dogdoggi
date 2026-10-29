import type { ReactNode } from "react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import type { MegaMenuGroup } from "@/data/site";

/**
 * Isla: mega menú del header de escritorio (Radix NavigationMenu: abre con
 * hover y teclado, cierra con Escape). Los grupos de enlaces llegan por props;
 * el banner destacado llega como slot `featured` desde Astro.
 * El panel se ancla bajo el trigger (`viewport={false}`); las clases con `!`
 * pisan las del modo sin viewport de shadcn sin editar components/ui.
 */
interface MegaMenuProps {
  label: string;
  groups: MegaMenuGroup[];
  featured?: ReactNode;
}

export default function MegaMenu({ label, groups, featured }: MegaMenuProps) {
  return (
    <NavigationMenu viewport={false}>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="h-auto min-h-11 gap-0.5 rounded-none bg-transparent px-0 py-0 text-sm font-extrabold hover:bg-transparent hover:text-orange focus:bg-transparent data-[state=open]:bg-transparent data-[state=open]:text-orange data-[state=open]:hover:bg-transparent data-[state=open]:focus:bg-transparent [&>svg]:size-4">
            {label}
          </NavigationMenuTrigger>
          <NavigationMenuContent className="left-1/2 z-30 grid w-[min(900px,85vw)]! -translate-x-[42%] grid-cols-[1.5fr_1fr] gap-7 mt-0! rounded-[0_0_22px_22px]! border-line! bg-paper! p-7 text-navy! shadow-[0_24px_45px_rgba(5,28,72,0.16)]!">
            <div className="grid grid-cols-2 gap-5">
              {groups.map((group) => (
                <div key={group.title}>
                  <strong className="mb-2.5 block font-display text-[17px]">{group.title}</strong>
                  <ul className="list-none p-0">
                    {group.links.map((link) => (
                      <li key={link.label}>
                        <NavigationMenuLink
                          href={link.href}
                          className="block min-h-[39px] rounded-none px-0 py-[5px] text-sm hover:bg-transparent hover:text-orange-dark focus:bg-transparent"
                        >
                          {link.label}
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            {featured}
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
