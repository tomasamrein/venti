export function formatARS(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function parseAmount(value: string): number {
  return parseFloat(value.replace(/[^0-9,-]/g, '').replace(',', '.')) || 0
}
