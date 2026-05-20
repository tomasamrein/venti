import { Logo } from '@/components/ui/logo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-background p-4">
      <div className="w-full flex flex-col items-center">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-2">
            <Logo className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight" iconSize={40} />
          </div>
          <p className="text-sm text-muted-foreground">Tu sistema de gestión</p>
        </div>
        {children}
      </div>
    </div>
  )
}
