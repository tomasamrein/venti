interface EmptyStateProps {
  variant: 'no-sales' | 'no-clients' | 'no-products' | 'no-notifications' | 'no-results' | 'no-accounts'
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

const ILLUSTRATIONS: Record<EmptyStateProps['variant'], React.ReactNode> = {
  'no-sales': (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="8" width="36" height="48" rx="4" fill="currentColor" opacity="0.06" stroke="currentColor" strokeWidth="1.5" opacity="0.2"/>
      <rect x="20" y="18" width="16" height="2.5" rx="1.25" fill="currentColor" opacity="0.3"/>
      <rect x="20" y="24" width="24" height="2.5" rx="1.25" fill="currentColor" opacity="0.2"/>
      <rect x="20" y="30" width="20" height="2.5" rx="1.25" fill="currentColor" opacity="0.2"/>
      <rect x="20" y="36" width="12" height="2.5" rx="1.25" fill="currentColor" opacity="0.15"/>
      <circle cx="44" cy="44" r="10" fill="var(--empty-bg, #f1f5f9)" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
      <line x1="40" y1="40" x2="48" y2="48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      <line x1="48" y1="40" x2="40" y2="48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
    </svg>
  ),
  'no-clients': (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="22" r="10" fill="currentColor" opacity="0.08" stroke="currentColor" strokeWidth="1.5" opacity="0.2"/>
      <path d="M14 50c0-9.941 8.059-18 18-18s18 8.059 18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.2"/>
      <circle cx="50" cy="50" r="8" fill="var(--empty-bg, #f1f5f9)" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
      <line x1="50" y1="47" x2="50" y2="53" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      <line x1="47" y1="50" x2="53" y2="50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
    </svg>
  ),
  'no-products': (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 8L52 19v26L32 56 12 45V19L32 8Z" fill="currentColor" opacity="0.06" stroke="currentColor" strokeWidth="1.5" opacity="0.2"/>
      <path d="M32 8v48M12 19l20 11 20-11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.15"/>
      <circle cx="46" cy="46" r="10" fill="var(--empty-bg, #f1f5f9)" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
      <line x1="42" y1="42" x2="50" y2="50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      <line x1="50" y1="42" x2="42" y2="50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
    </svg>
  ),
  'no-notifications': (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 12a16 16 0 0116 16v10l4 6H12l4-6V28A16 16 0 0132 12Z" fill="currentColor" opacity="0.06" stroke="currentColor" strokeWidth="1.5" opacity="0.2"/>
      <path d="M28 44a4 4 0 008 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.25"/>
      <text x="44" y="22" fontSize="10" fill="currentColor" opacity="0.3" fontFamily="sans-serif">z</text>
      <text x="50" y="16" fontSize="8" fill="currentColor" opacity="0.2" fontFamily="sans-serif">z</text>
    </svg>
  ),
  'no-results': (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="16" fill="currentColor" opacity="0.06" stroke="currentColor" strokeWidth="1.5" opacity="0.2"/>
      <line x1="39" y1="39" x2="52" y2="52" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.2"/>
      <line x1="22" y1="24" x2="34" y2="24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
      <line x1="22" y1="28" x2="30" y2="28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.2"/>
      <line x1="22" y1="32" x2="27" y2="32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.15"/>
    </svg>
  ),
  'no-accounts': (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="14" width="44" height="36" rx="4" fill="currentColor" opacity="0.06" stroke="currentColor" strokeWidth="1.5" opacity="0.2"/>
      <path d="M10 24h44" stroke="currentColor" strokeWidth="1.5" opacity="0.2"/>
      <rect x="16" y="30" width="10" height="6" rx="2" fill="currentColor" opacity="0.15"/>
      <rect x="32" y="30" width="16" height="2" rx="1" fill="currentColor" opacity="0.15"/>
      <rect x="32" y="35" width="10" height="2" rx="1" fill="currentColor" opacity="0.1"/>
      <text x="19" y="36" fontSize="8" fill="currentColor" opacity="0.4" fontFamily="sans-serif" fontWeight="bold">$</text>
    </svg>
  ),
}

export function EmptyState({ variant, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
      <div className="text-muted-foreground mb-4 [--empty-bg:theme(colors.slate.100)] dark:[--empty-bg:theme(colors.slate.800)]">
        {ILLUSTRATIONS[variant]}
      </div>
      <p className="text-[15px] font-semibold text-foreground">{title}</p>
      {description && (
        <p className="text-[13px] text-muted-foreground mt-1 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
