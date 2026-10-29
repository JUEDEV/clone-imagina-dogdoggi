import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import useEmblaCarousel from "embla-carousel-react";
import type { EmblaOptionsType } from "embla-carousel";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Isla genérica de carrusel (Embla). Solo aporta el comportamiento: los slides
 * llegan como `children` desde Astro (HTML estático de moléculas .astro marcadas
 * con `data-carousel-slide`), así que no se hidrata el marcado de las tarjetas.
 *
 * Astro envuelve los slots en <astro-slot> (display: contents), por eso Embla
 * busca los slides por selector en vez de usar los hijos directos del track.
 *
 * El slide seleccionado recibe `data-active="true"`: el CSS de cada sección
 * puede animarlo sin que la isla conozca su marcado.
 */
interface CarouselProps {
  children: ReactNode;
  /** Slot con nombre `header` desde Astro: se pinta junto a las flechas de escritorio. */
  header?: ReactNode;
  /** Slot con nombre `footer` desde Astro: se pinta debajo de los controles. */
  footer?: ReactNode;
  options?: EmblaOptionsType;
  /** Intervalo de autoplay en ms (0 = sin autoplay). */
  autoplay?: number;
  pauseOnHover?: boolean;
  /** Botón visible de pausar/reanudar el autoplay (WCAG 2.2.2). */
  pauseButton?: boolean;
  /**
   * `below`: anterior · puntos · siguiente, centrados debajo.
   * `header`: flechas dentro del header (con contador si `counter`).
   * `end`: puntos y pausa a la izquierda, flechas a la derecha (ocultas en móvil).
   * `sides`: flechas flotantes a izquierda y derecha, centradas sobre los slides.
   */
  arrows?: "none" | "below" | "header" | "end" | "sides";
  dots?: boolean;
  /** Muestra "n / total" entre las flechas del header. */
  counter?: boolean;
  /** `bars`: puntos alargados (hero); `dots`: puntos redondos. */
  dotStyle?: "dots" | "bars";
  prevLabel?: string;
  nextLabel?: string;
  /** Etiqueta de cada punto; `{n}` se reemplaza por el número (las props de una isla deben ser serializables). */
  dotLabel?: string;
  pauseLabels?: { pause: string; play: string };
  /** Retrasos de reveal (ms) para las flechas del header y el viewport. */
  revealDelay?: { arrows?: number; viewport?: number };
  className?: string;
  headerClassName?: string;
  viewportClassName?: string;
  trackClassName?: string;
  controlsClassName?: string;
  /** Solo `sides`: ajuste de posición de las flechas (p. ej. `top-[40%]`). */
  sideArrowsClassName?: string;
}

const arrowClass =
  "inline-grid size-11 place-items-center rounded-full border border-navy text-navy transition-colors duration-200 hover:bg-navy hover:text-white active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-navy";

const plainArrowClass =
  "inline-grid size-11 place-items-center rounded-full text-navy transition-colors duration-200 hover:bg-[#e5f8f7] hover:text-turquoise-dark active:scale-95 disabled:opacity-30";

const sideArrowClass =
  "absolute top-1/2 z-10 inline-grid size-11 -translate-y-1/2 place-items-center rounded-full bg-paper/90 text-navy shadow-lg shadow-navy/15 transition-colors duration-200 hover:bg-navy hover:text-white disabled:pointer-events-none disabled:opacity-0";

const revealProps = (delay?: number) =>
  delay === undefined
    ? {}
    : {
        // Layout.astro agrega .is-visible a este nodo antes o después de hidratar;
        // React no parchea atributos al hidratar, así que solo silenciamos el aviso.
        suppressHydrationWarning: true,
        style: { "--reveal-delay": `${delay}ms` } as CSSProperties,
      };

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function Carousel({
  children,
  header,
  footer,
  options,
  autoplay = 0,
  pauseOnHover = false,
  pauseButton = false,
  arrows = "none",
  dots = false,
  counter = false,
  dotStyle = "dots",
  prevLabel = "Anterior",
  nextLabel = "Siguiente",
  dotLabel = "Ir al elemento {n}",
  pauseLabels = { pause: "Pausar", play: "Reanudar" },
  revealDelay,
  className,
  headerClassName,
  viewportClassName,
  trackClassName,
  controlsClassName,
  sideArrowsClassName,
}: CarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ ...options, slides: "[data-carousel-slide]" });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const [snaps, setSnaps] = useState<number[]>([]);
  const [selected, setSelected] = useState(0);
  // Pausa explícita del usuario: a diferencia del hover, no se reanuda sola.
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }, []);

  const start = useCallback(() => {
    stop();
    if (!autoplay || !emblaApi || paused || reducedMotion()) return;
    timer.current = setInterval(() => emblaApi.scrollNext(), autoplay);
  }, [autoplay, emblaApi, paused, stop]);

  useEffect(() => {
    if (!emblaApi) return;
    const update = () => {
      const index = emblaApi.selectedScrollSnap();
      setCanPrev(emblaApi.canScrollPrev());
      setCanNext(emblaApi.canScrollNext());
      setSelected(index);
      emblaApi.slideNodes().forEach((node, i) => {
        node.dataset.active = String(i === index);
      });
    };
    const reInit = () => {
      setSnaps(emblaApi.scrollSnapList());
      update();
    };
    reInit();
    start();
    emblaApi.on("select", update);
    emblaApi.on("reInit", reInit);
    emblaApi.on("pointerDown", stop);
    return () => {
      stop();
      emblaApi.off("select", update);
      emblaApi.off("reInit", reInit);
      emblaApi.off("pointerDown", stop);
    };
  }, [emblaApi, start, stop]);

  // Un clic en los controles reinicia el autoplay en vez de cortarlo.
  const go = (action: () => void) => {
    stop();
    action();
    start();
  };

  const Prev = arrows === "end" ? ChevronLeft : ArrowLeft;
  const Next = arrows === "end" ? ChevronRight : ArrowRight;
  const prevButton = (className = arrowClass) => (
    <button type="button" onClick={() => go(() => emblaApi?.scrollPrev())} disabled={!canPrev} aria-label={prevLabel} className={className}>
      <Prev className="size-5" />
    </button>
  );
  const nextButton = (className = arrowClass) => (
    <button type="button" onClick={() => go(() => emblaApi?.scrollNext())} disabled={!canNext} aria-label={nextLabel} className={className}>
      <Next className="size-5" />
    </button>
  );

  // Los puntos dependen de los snaps de Embla, así que aparecen al hidratar.
  const dotButtons = dots && snaps.length > 1 && (
    <div className="flex items-center gap-[7px]">
      {snaps.map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => go(() => emblaApi?.scrollTo(i))}
          aria-label={dotLabel.replace("{n}", String(i + 1))}
          aria-current={selected === i ? "true" : undefined}
          className={cn(
            "flex min-h-11 items-center justify-center transition-[width] duration-300",
            dotStyle === "bars" ? (selected === i ? "w-[54px]" : "w-11") : "min-w-2.5",
          )}
        >
          <span
            className={cn(
              "block rounded-full transition-all duration-300",
              dotStyle === "bars" ? "h-1.5 w-full" : cn("size-2", selected === i && "w-5"),
              selected === i ? "bg-navy" : "bg-navy/20 hover:bg-navy/40",
            )}
          />
        </button>
      ))}
    </div>
  );

  const pauseControl = pauseButton && autoplay > 0 && (
    <button
      type="button"
      onClick={() => setPaused((v) => !v)}
      aria-label={paused ? pauseLabels.play : pauseLabels.pause}
      className="flex min-h-11 items-center gap-1.5 text-xs font-extrabold max-md:ml-auto"
    >
      {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
      {paused ? pauseLabels.play : pauseLabels.pause}
    </button>
  );

  // Si Embla calcula un solo snap (todo cabe en pantalla) no hay nada que controlar.
  const showBelow = (arrows === "below" || arrows === "header" || dots) && snaps.length !== 1;

  return (
    <div
      className={className}
      onMouseEnter={pauseOnHover ? stop : undefined}
      onMouseLeave={pauseOnHover ? start : undefined}
    >
      {header && (
        <div className={headerClassName}>
          {header}
          {arrows === "header" && (
            <div
              className={cn("hidden items-center gap-4 md:flex", revealDelay?.arrows !== undefined && "reveal")}
              {...revealProps(revealDelay?.arrows)}
            >
              {prevButton()}
              {counter && snaps.length > 0 && (
                <span className="text-[13px] font-extrabold" aria-live="polite">
                  {selected + 1} / {snaps.length}
                </span>
              )}
              {nextButton()}
            </div>
          )}
        </div>
      )}

      {/* El reveal va en este envoltorio para que las flechas laterales aparezcan junto a los slides. */}
      <div
        className={cn("relative", revealDelay?.viewport !== undefined && "reveal")}
        {...revealProps(revealDelay?.viewport)}
      >
        <div ref={emblaRef} className={viewportClassName}>
          <div className={trackClassName}>{children}</div>
        </div>
        {arrows === "sides" && snaps.length !== 1 && (
          <>
            {prevButton(cn(sideArrowClass, "left-2 md:left-4", sideArrowsClassName))}
            {nextButton(cn(sideArrowClass, "right-2 md:right-4", sideArrowsClassName))}
          </>
        )}
      </div>

      {arrows === "end" ? (
        <div className={cn("flex min-h-[60px] items-center gap-3 md:gap-[18px]", controlsClassName)}>
          {dotButtons}
          {pauseControl}
          <div className="ml-auto hidden md:flex">
            {prevButton(plainArrowClass)}
            {nextButton(plainArrowClass)}
          </div>
        </div>
      ) : (
        showBelow && (
          <div
            className={cn(
              "mt-8 flex items-center justify-center",
              dots ? "gap-6" : "gap-3",
              arrows === "header" && "md:hidden",
              controlsClassName,
            )}
          >
            {(arrows === "below" || arrows === "header") && prevButton()}
            {dotButtons}
            {counter && arrows === "header" && snaps.length > 0 && (
              <span className="text-[13px] font-extrabold">
                {selected + 1} / {snaps.length}
              </span>
            )}
            {pauseControl}
            {(arrows === "below" || arrows === "header") && nextButton()}
          </div>
        )
      )}

      {footer}
    </div>
  );
}
