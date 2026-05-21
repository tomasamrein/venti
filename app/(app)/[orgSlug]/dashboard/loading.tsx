export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 rounded-xl bg-muted/50 animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-28 rounded-2xl border border-border bg-card animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-64 rounded-2xl border border-border bg-card animate-pulse" />
        <div className="h-64 rounded-2xl border border-border bg-card animate-pulse" />
      </div>
    </div>
  )
}
