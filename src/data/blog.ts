/**
 * Contenido del blog. Para publicar un artículo nuevo basta con agregar una
 * entrada a ARTICLES: el índice (/blog), la plantilla de artículo
 * (/blog/[slug]) y la vitrina del home se alimentan de aquí.
 *
 * TODO: los cuerpos son contenido de muestra (la plantilla solo traía el
 * extracto); reemplazar por los textos reales o por el blog de Strata.
 */

export type ArticleBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'list'; items: string[] }

export interface Article {
  slug: string
  category: string
  title: string
  excerpt: string
  /** Fecha ISO (YYYY-MM-DD). */
  date: string
  image: string
  alt: string
  content: ArticleBlock[]
}

export const ARTICLES: Article[] = [
  {
    slug: 'como-elegir-la-cuchilla-correcta',
    category: 'Guía técnica',
    title: 'Cómo elegir la cuchilla correcta para cada tipo de pelo',
    excerpt:
      'Conoce las medidas, el sentido del corte y los cuidados básicos para trabajar con mayor precisión.',
    date: '2026-10-12',
    image: '/images/photos/peluquero-corte.webp',
    alt: 'Peluquero canino recortando el pelaje de un perro con máquina',
    content: [
      {
        type: 'p',
        text: 'La cuchilla define el largo final del corte, pero también la comodidad del perro y el tiempo que tardas en cada servicio. Elegir bien desde el principio evita repasos, irritaciones y cuchillas que se calientan antes de tiempo.',
      },
      { type: 'h2', text: 'Las medidas más usadas' },
      {
        type: 'list',
        items: [
          'N.º 10: la más versátil; ideal para zonas sanitarias, almohadillas y vientre.',
          'N.º 7F y 5F: acabados uniformes en el cuerpo con un largo corto y prolijo.',
          'N.º 4F y 3F: dejan más largo y suavizan la transición con el trabajo de tijera.',
        ],
      },
      { type: 'h2', text: 'El sentido del corte' },
      {
        type: 'p',
        text: 'A favor del pelo, la cuchilla deja un largo cercano a su medida nominal; a contrapelo, corta bastante más corto. Prueba siempre en una zona discreta antes de trabajar el cuerpo completo.',
      },
      { type: 'quote', text: 'Una cuchilla limpia y bien lubricada corta mejor y dura mucho más.' },
      { type: 'h2', text: 'Cuidados básicos' },
      {
        type: 'p',
        text: 'Retira el pelo después de cada servicio, aplica refrigerante durante jornadas largas y lubrica antes de guardar. Si notas que la cuchilla jala el pelo, es momento de un afilado profesional.',
      },
    ],
  },
  {
    slug: 'secado-profesional-rutina-eficiente',
    category: 'Técnicas',
    title: 'Secado profesional: una rutina más cómoda y eficiente',
    excerpt:
      'Organiza tu puesto y ajusta el proceso de secado según las necesidades de cada pelaje.',
    date: '2026-09-28',
    image: '/images/photos/sesion-secado.webp',
    alt: 'Sesión de secado profesional de un perro en la mesa de peluquería',
    content: [
      {
        type: 'p',
        text: 'El secado es una de las etapas que más tiempo consume en la peluquería. Con un puesto organizado y la técnica adecuada para cada pelaje, puedes reducirlo sin sacrificar el resultado.',
      },
      { type: 'h2', text: 'Antes de encender el soplador' },
      {
        type: 'list',
        items: [
          'Retira el exceso de agua con una toalla de microfibra.',
          'Ten a mano cepillo, peine y toallas para no interrumpir el proceso.',
          'Ajusta la temperatura y la potencia según el tamaño y la sensibilidad del perro.',
        ],
      },
      { type: 'h2', text: 'Según el tipo de pelaje' },
      {
        type: 'p',
        text: 'Los pelajes dobles se benefician del soplador de alta potencia para retirar el subpelo muerto; los pelajes rizados piden secado y cepillado simultáneos para lograr un acabado liso y uniforme.',
      },
      {
        type: 'p',
        text: 'Termina siempre revisando zonas como axilas y detrás de las orejas, donde la humedad suele quedarse y puede irritar la piel.',
      },
    ],
  },
  {
    slug: 'cuidado-y-mantenimiento-de-tijeras',
    category: 'Herramientas',
    title: 'Cuidado y mantenimiento de tus tijeras de peluquería',
    excerpt:
      'Limpieza, almacenamiento y señales para saber cuándo es momento de un afilado profesional.',
    date: '2026-09-09',
    image: '/images/photos/puesto-trabajo.webp',
    alt: 'Puesto de trabajo de peluquería canina con herramientas organizadas',
    content: [
      {
        type: 'p',
        text: 'Unas buenas tijeras son una inversión. Con cuidados sencillos al final de cada jornada mantienen el filo, la tensión y la precisión durante mucho más tiempo.',
      },
      { type: 'h2', text: 'Limpieza diaria' },
      {
        type: 'p',
        text: 'Retira el pelo y los residuos de producto con un paño suave, seca bien las hojas y aplica una gota de aceite en el tornillo. Abre y cierra varias veces para distribuirlo.',
      },
      { type: 'h2', text: 'Almacenamiento' },
      {
        type: 'list',
        items: [
          'Guárdalas cerradas, en estuche y separadas de otras herramientas.',
          'Evita dejarlas sobre la mesa húmeda o cerca del soplador.',
          'Revisa la tensión del tornillo una vez por semana.',
        ],
      },
      { type: 'quote', text: 'Si la tijera dobla el pelo en lugar de cortarlo, necesita afilado.' },
      {
        type: 'p',
        text: 'Escríbenos por WhatsApp si necesitas orientación sobre repuestos o afilado: te ayudamos a encontrar la mejor opción para tus herramientas.',
      },
    ],
  },
]

export const articleHref = (article: Pick<Article, 'slug'>) => `/blog/${article.slug}`

const dateFormat = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
export const formatDate = (iso: string) => dateFormat.format(new Date(iso))
