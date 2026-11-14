// Precios en pesos colombianos, enteros, como en la plantilla ("$189.000").
export const money = (value: number) => `$${Math.round(value).toLocaleString('es-CO')}`

export const discountPercent = (price: number, compareAt?: number) =>
  compareAt && compareAt > price ? Math.min(99, Math.max(1, Math.round((1 - price / compareAt) * 100))) : 0
