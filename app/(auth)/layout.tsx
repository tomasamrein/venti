import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-background p-4">
      <div className="w-full flex flex-col items-center">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-2">
            <Image src="/logo-light.png" alt="Ventix" width={140} height={40} className="h-10 w-auto dark:invert" priority />
          </div>
          <p className="text-sm text-muted-foreground">Tu sistema de gestión</p>
        </div>
        {children}
      </div>
    </div>
  )
}
