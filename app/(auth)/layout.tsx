import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-background p-4">
      <div className="w-full flex flex-col items-center">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2.5 mb-2">
            <Image src="/isotipo.png" alt="Ventix" width={40} height={40} className="h-10 w-10" priority />
            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Ventix</span>
          </div>
          <p className="text-sm text-muted-foreground">Tu sistema de gestión</p>
        </div>
        {children}
      </div>
    </div>
  )
}
