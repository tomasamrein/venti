export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
            venti
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Tu sistema de gestión</p>
        </div>
        {children}
      </div>
    </div>
  )
}
