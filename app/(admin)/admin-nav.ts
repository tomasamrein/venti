import { LayoutDashboard, Building2, CreditCard, Users, MessageSquare } from 'lucide-react'

export const ADMIN_NAV = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Organizaciones', href: '/admin/organizaciones', icon: Building2 },
  { label: 'Suscripciones', href: '/admin/suscripciones', icon: CreditCard },
  { label: 'Usuarios', href: '/admin/usuarios', icon: Users },
  { label: 'Mensajes', href: '/admin/mensajes', icon: MessageSquare },
]
