import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Isla: buscador del header. Consulta `endpoint?q=` (por defecto /api/search)
 * y pinta los resultados en un desplegable. En móvil solo se ve la lupa, que
 * abre el formulario flotante bajo el header.
 */
export interface SearchResult {
  id: number;
  name: string;
  category: string;
  price: string;
  image: string;
  href: string;
}

interface SearchBoxProps {
  endpoint?: string;
  placeholder?: string;
  /** Sugerencias para el estado vacío. */
  hints?: string[];
}

type Status = "idle" | "loading" | "done" | "error";

export default function SearchBox({
  endpoint = "/api/search",
  placeholder = "Buscar productos…",
  hints = [],
}: SearchBoxProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  // Cada búsqueda nueva aborta la anterior para no pintar resultados viejos.
  useEffect(() => {
    if (!submitted) return;
    const controller = new AbortController();
    setStatus("loading");
    fetch(`${endpoint}?q=${encodeURIComponent(submitted)}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data: SearchResult[]) => {
        setResults(data);
        setStatus("done");
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus("error");
      });
    return () => controller.abort();
  }, [endpoint, submitted]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setSubmitted("");
      setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    const clean = query.trim();
    if (!clean) {
      inputRef.current?.focus();
      return;
    }
    setSubmitted(clean);
  };

  const clear = () => {
    setQuery("");
    setSubmitted("");
    inputRef.current?.focus();
  };

  return (
    <div className="flex justify-end md:block md:relative">
      <button
        type="button"
        className="grid size-11 place-items-center rounded-full transition-colors hover:bg-[#e5f8f7] hover:text-turquoise-dark md:hidden"
        aria-label={mobileOpen ? "Cerrar búsqueda" : "Buscar"}
        aria-expanded={mobileOpen}
        onClick={() => {
          setMobileOpen((v) => !v);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
      >
        <Search className="size-[22px]" />
      </button>

      <form
        role="search"
        onSubmit={onSubmit}
        className={cn(
          "relative h-[52px] items-center rounded-[15px] border-2 border-turquoise bg-white pl-[17px] md:flex",
          "max-md:absolute max-md:inset-x-4 max-md:top-[105px] max-md:z-25 max-md:shadow-[0_10px_30px_rgba(5,28,72,0.15)]",
          mobileOpen ? "flex" : "hidden",
        )}
      >
        <Search className="size-[21px] shrink-0 text-turquoise-dark" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label="Buscar productos"
          className="w-full min-w-0 border-0 bg-transparent px-3 text-base text-navy outline-0 placeholder:text-xs placeholder:text-[#6d788a] md:placeholder:text-sm"
        />
        {query && (
          <button type="button" onClick={clear} aria-label="Limpiar búsqueda" className="grid min-h-11 min-w-11 place-items-center md:min-h-0 md:min-w-0 md:p-2">
            <X className="size-[17px]" />
          </button>
        )}
        <button type="submit" className="mr-[3px] h-[42px] rounded-[10px] bg-navy px-[15px] font-extrabold text-white md:px-[22px]">
          Buscar
        </button>

        {submitted && (
          <div className="absolute inset-x-0 top-[calc(100%+10px)] z-40 max-h-[65dvh] overflow-auto rounded-[18px] border border-line bg-paper p-3 shadow-[0_20px_50px_rgba(5,28,72,0.18)] md:max-h-[430px]">
            <div className="flex items-center justify-between px-1.5 pt-[5px] pb-3 text-[13px] font-extrabold">
              <span>Resultados para “{submitted}”</span>
              <button type="button" onClick={() => setSubmitted("")} aria-label="Cerrar resultados" className="grid min-h-11 min-w-11 place-items-center md:min-h-9 md:min-w-9">
                <X className="size-[18px]" />
              </button>
            </div>
            <div aria-live="polite">
              {status === "loading" && <p className="m-0 px-3 py-6 text-ink-soft">Buscando en el catálogo…</p>}
              {status === "error" && <p className="m-0 px-3 py-6 text-ink-soft">No pudimos buscar ahora. Intenta de nuevo.</p>}
              {status === "done" &&
                (results.length ? (
                  <ul className="m-0 list-none p-0">
                    {results.map((item) => (
                      <li key={item.id}>
                        <a
                          href={item.href}
                          onClick={() => setSubmitted("")}
                          className="grid w-full grid-cols-[56px_1fr_auto] items-center gap-3 border-t border-line p-2.5 text-left hover:bg-[#eefafa]"
                        >
                          <img src={item.image} alt="" className="size-14 object-contain" />
                          <span>
                            <strong className="block text-sm">{item.name}</strong>
                            <small className="block text-ink-soft">
                              {item.category} · {item.price}
                            </small>
                          </span>
                          <ArrowUpRight className="size-[18px]" />
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex flex-col px-3 py-6 text-ink-soft">
                    <strong>No encontramos coincidencias.</strong>
                    {hints.length > 0 && <span>Prueba con {hints.map((h) => `“${h}”`).join(", ")}.</span>}
                  </div>
                ))}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
