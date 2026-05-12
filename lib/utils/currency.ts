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

// Intl.NumberFormat (es-AR) uses non-breaking spaces (\u00A0) between $ and digits.
// encodeURIComponent turns \u00A0 into %C2%A0, which WhatsApp renders as Â or ��.
// Always use this when building wa.me links.
export function waEncode(text: string): string {
  return encodeURIComponent(text.replace(/\u00A0/g, ' '))
}
