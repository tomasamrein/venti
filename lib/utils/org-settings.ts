/** La org opera en modo servicios: sin gestión de inventario/productos. */
export function isInventoryDisabled(settings: unknown): boolean {
  if (!settings || typeof settings !== 'object') return false
  return (settings as Record<string, unknown>).inventory_disabled === true
}
