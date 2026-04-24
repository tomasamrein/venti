export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-slate-50 to-sky-50 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/30 p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-emerald-400/10 dark:bg-emerald-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-sky-400/10 dark:bg-sky-500/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-emerald-300/5 dark:bg-emerald-400/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full flex flex-col items-center">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-emerald-600 to-emerald-500 dark:from-emerald-400 dark:to-emerald-300 bg-clip-text text-transparent">
              venti
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 font-medium">Tu sistema de gestión</p>
        </div>
        {children}
      </div>
    </div>
  )
}
