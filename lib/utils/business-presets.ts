/**
 * Presets por tipo de negocio. Se aplican al crear la organización:
 *  - settings: flags que activan features del POS (copy_service_enabled, etc.)
 *  - categories: categorías default pre-cargadas para acelerar el onboarding
 */

export type BusinessType = 'kiosco' | 'almacen' | 'drugstore' | 'fotocopiadora' | 'otro'

export interface BusinessPreset {
  settings: Record<string, unknown>
  categories: { name: string; color: string; icon: string }[]
}

export const BUSINESS_PRESETS: Record<BusinessType, BusinessPreset> = {
  kiosco: {
    settings: {
      quick_pos_mode: true,
    },
    categories: [
      { name: 'Golosinas',     color: '#ec4899', icon: 'Candy' },
      { name: 'Bebidas',       color: '#0ea5e9', icon: 'CupSoda' },
      { name: 'Cigarrillos',   color: '#64748b', icon: 'Cigarette' },
      { name: 'Snacks',        color: '#f59e0b', icon: 'Cookie' },
      { name: 'Galletitas',    color: '#a16207', icon: 'Cookie' },
      { name: 'Lácteos',       color: '#3b82f6', icon: 'Milk' },
      { name: 'Helados',       color: '#06b6d4', icon: 'IceCream' },
    ],
  },
  almacen: {
    settings: {
      weight_sales_enabled: true,
      suppliers_panel: true,
    },
    categories: [
      { name: 'Almacén',       color: '#a16207', icon: 'Package' },
      { name: 'Fiambres',      color: '#dc2626', icon: 'Sandwich' },
      { name: 'Lácteos',       color: '#3b82f6', icon: 'Milk' },
      { name: 'Panadería',     color: '#f59e0b', icon: 'CroissantIcon' },
      { name: 'Verdulería',    color: '#16a34a', icon: 'Apple' },
      { name: 'Bebidas',       color: '#0ea5e9', icon: 'CupSoda' },
      { name: 'Limpieza',      color: '#06b6d4', icon: 'SprayCan' },
      { name: 'Congelados',    color: '#0284c7', icon: 'Snowflake' },
    ],
  },
  drugstore: {
    settings: {
      employee_switcher_enabled: true,
      extended_hours: true,
    },
    categories: [
      { name: 'Perfumería',       color: '#a855f7', icon: 'Sparkles' },
      { name: 'Cuidado personal', color: '#ec4899', icon: 'Droplet' },
      { name: 'Limpieza',         color: '#06b6d4', icon: 'SprayCan' },
      { name: 'Bebidas',          color: '#0ea5e9', icon: 'CupSoda' },
      { name: 'Snacks',           color: '#f59e0b', icon: 'Cookie' },
      { name: 'Cigarrillos',      color: '#64748b', icon: 'Cigarette' },
      { name: 'Golosinas',        color: '#f43f5e', icon: 'Candy' },
      { name: 'Farmacia OTC',     color: '#10b981', icon: 'Pill' },
    ],
  },
  fotocopiadora: {
    settings: {
      copy_service_enabled: true,
    },
    categories: [
      { name: 'Librería',           color: '#3b82f6', icon: 'PencilLine' },
      { name: 'Útiles escolares',   color: '#f59e0b', icon: 'GraduationCap' },
      { name: 'Insumos de oficina', color: '#64748b', icon: 'Briefcase' },
      { name: 'Cartuchos y tóner',  color: '#0f172a', icon: 'Printer' },
      { name: 'Papelería',          color: '#a16207', icon: 'FileText' },
    ],
  },
  otro: {
    settings: {},
    categories: [
      { name: 'General', color: '#64748b', icon: 'Package' },
    ],
  },
}

export function getBusinessPreset(type: string | null | undefined): BusinessPreset {
  const t = type as BusinessType
  return BUSINESS_PRESETS[t] ?? BUSINESS_PRESETS.otro
}
