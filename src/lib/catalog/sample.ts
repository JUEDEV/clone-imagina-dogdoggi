import type { Catalog, Category, Product } from './types'

/**
 * Catálogo de muestra con la misma forma que el de Strata. Se usa mientras no
 * exista `CMS_BASE_URL` (desarrollo, demos). Al conectar Strata deja de usarse
 * y sirve de referencia para el seed.
 */

const cat = (id: string, name: string, parentId: string | null, sort: number, description?: string): Category => ({
  id,
  slug: id,
  name,
  parentId,
  sort,
  description,
})

// Mismas categorías y slugs que el menú Tienda (data/site.ts → SHOP_MENU).
const CATEGORIES: Category[] = [
  cat('cosmetica', 'Cosmética', null, 1, 'Shampoos, acondicionadores y productos para el cuidado del pelaje, con la línea exclusiva Perfect Groom.'),
  cat('complementos', 'Complementos', null, 2, 'Cepillería, peines y accesorios para preparar y terminar cada servicio.'),
  cat('tijeras', 'Tijeras', null, 3, 'Tijeras profesionales rectas, curvas, de esculpir y microdentadas para cortes precisos.'),
  cat('tijeras-curvas', 'Tijeras curvas', 'tijeras', 1),
  cat('tijeras-microdentadas', 'Tijeras microdentadas', 'tijeras', 2),
  cat('tijeras-de-esculpir', 'Tijeras de esculpir', 'tijeras', 3),
  cat('tijeras-chunkers', 'Tijeras chunkers', 'tijeras', 4),
  cat('tijeras-para-zurdos', 'Tijeras para zurdos', 'tijeras', 5),
  cat('tijeras-dna', 'Tijeras DNA', 'tijeras', 6),
  cat('sets-de-tijeras', 'Sets de tijeras', 'tijeras', 7),
  cat('complementos-tijeras', 'Complementos tijeras', 'tijeras', 8),
  cat('maquinas', 'Máquinas', null, 4, 'Máquinas de corte profesionales para el trabajo diario en la peluquería.'),
  cat('cuchillas', 'Cuchillas', null, 5, 'Cuchillas de repuesto en distintas medidas para tus máquinas de corte.'),
  cat('equipamiento', 'Equipamiento', null, 6, 'Secadores, sopladores, mesas y repuestos para equipar tu peluquería.'),
  cat('secadores-y-sopladores', 'Secadores y sopladores', 'equipamiento', 1),
  cat('mesas-de-corte', 'Mesas de corte', 'equipamiento', 2),
  cat('repuestos-y-accesorios', 'Repuestos y accesorios', 'equipamiento', 3),
  cat('vestuario-profesional', 'Vestuario profesional', null, 7, 'Batas, delantales y prendas pensadas para el trabajo en la peluquería.'),
  cat('formacion', 'Formación', null, 8, 'Cursos y talleres para seguir creciendo como peluquero canino.'),
]

const SHAMPOO_TEXT =
  '<p>Fórmula profesional para el baño en peluquería: limpia a fondo, respeta el pH de la piel y deja el pelaje suave y brillante.</p><ul><li>Presentación de 2000 ml para uso profesional.</li><li>Rinde varias diluciones según el tipo de pelaje.</li></ul>'

let order = 0
const product = (p: Omit<Product, 'id' | 'images' | 'featured' | 'createdAt' | 'sort' | 'stock'> & Partial<Pick<Product, 'featured' | 'stock' | 'createdAt'>>): Product => ({
  id: p.slug,
  images: [p.image],
  featured: false,
  stock: null,
  createdAt: '2026-10-01T00:00:00Z',
  sort: ++order,
  ...p,
})

const PRODUCTS: Product[] = [
  product({ slug: 'shampoo-alisante-natural-2000', sku: 'PG-SH-ALI-2000', name: 'Shampoo alisante natural 2000 ml', price: 68900, image: '/images/products/perfect-groom-shampoo.jpeg', categoryId: 'cosmetica', brand: 'Perfect Groom', featured: true, description: SHAMPOO_TEXT, stock: 24 }),
  product({ slug: 'tijera-curva-profesional-7-5', sku: 'TJ-CUR-75', name: 'Tijera curva profesional 7.5”', price: 189000, compareAtPrice: 219000, image: '/images/products/tijera-curva.png', categoryId: 'tijeras-curvas', badge: 'oferta', featured: true, stock: 6, description: '<p>Tijera curva en acero inoxidable para contornos y acabados redondeados. Tornillo de ajuste y apoyadedos removible.</p>' }),
  product({ slug: 'kit-tijeras-peine-metalico', sku: 'TJ-KIT-01', name: 'Kit de tijeras y peine metálico', price: 249900, compareAtPrice: 289900, image: '/images/products/kit-tijeras.png', categoryId: 'sets-de-tijeras', badge: 'nuevo', featured: true, createdAt: '2026-11-01T00:00:00Z', stock: 3, description: '<p>Kit con tijera recta, tijera curva, entresacadora y peine metálico, en estuche de transporte.</p>' }),
  product({ slug: 'set-esencial-cepilleria', sku: 'CP-SET-01', name: 'Set esencial de cepillería', price: 159900, compareAtPrice: 189900, image: '/images/products/set-cepilleria.png', categoryId: 'complementos', badge: 'oferta', featured: true, description: '<p>Carda, cepillo de cerdas y peine de desenredo para preparar el pelaje antes del corte.</p>' }),
  product({ slug: 'shampoo-limpieza-profunda-2000', sku: 'PG-SH-LIM-2000', name: 'Shampoo limpieza profunda 2000 ml', price: 64900, compareAtPrice: 74900, image: '/images/products/perfect-groom-shampoo.jpeg', categoryId: 'cosmetica', brand: 'Perfect Groom', featured: true, description: SHAMPOO_TEXT, stock: 0 }),
  product({ slug: 'herramientas-acabado-profesional', sku: 'AC-ACB-01', name: 'Herramientas para acabado profesional', price: 119000, compareAtPrice: 139000, image: '/images/products/herramientas-acabado.png', categoryId: 'complementos-tijeras', description: '<p>Accesorios para el acabado del corte: peines guía, limas y pinzas.</p>' }),
  product({ slug: 'shampoo-cuidado-pelaje', sku: 'CS-SH-PEL', name: 'Shampoo para cuidado del pelaje', price: 42900, compareAtPrice: 49900, image: '/images/products/shampoo-pelaje.png', categoryId: 'cosmetica', badge: 'oferta', description: '<p>Shampoo de uso diario para todo tipo de pelaje.</p>' }),
  product({ slug: 'espuma-limpieza-sin-enjuague', sku: 'CS-ESP-SE', name: 'Espuma de limpieza sin enjuague', price: 38900, compareAtPrice: 45900, image: '/images/products/espuma-sin-enjuague.png', categoryId: 'cosmetica', badge: 'oferta', description: '<p>Limpieza en seco para patas y zonas puntuales, sin necesidad de baño.</p>' }),
  product({ slug: 'soplador-profesional-alta-potencia', sku: 'EQ-SOP-01', name: 'Soplador profesional de alta potencia', price: 459000, compareAtPrice: 529000, image: '/images/photos/secado-profesional.webp', categoryId: 'secadores-y-sopladores', badge: 'nuevo', createdAt: '2026-11-05T00:00:00Z', stock: 4, description: '<p>Soplador de dos velocidades y control de temperatura para secado profesional.</p>' }),
  product({ slug: 'mesa-peluqueria-ajustable', sku: 'EQ-MES-01', name: 'Mesa de peluquería ajustable', price: 689000, image: '/images/photos/puesto-trabajo.webp', categoryId: 'mesas-de-corte', stock: 2, description: '<p>Mesa con altura ajustable, superficie antideslizante y brazo de sujeción.</p>' }),
]

export const SAMPLE_CATALOG: Catalog = { categories: CATEGORIES, products: PRODUCTS, source: 'sample' }
