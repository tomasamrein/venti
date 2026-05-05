export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-background p-4">
      <div className="w-full flex flex-col items-center">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center">
              <span className="text-white text-sm font-black">V</span>
            </div>
            <span className="text-2xl font-bold text-foreground tracking-tight">venti</span>
          </div>
          <p className="text-sm text-muted-foreground">Tu sistema de gestión</p>
        </div>
        {children}
      </div>
    </div>
  )
}
