import { cn } from '@/lib/utils'

interface LogoProps {
  variant?: 'full' | 'icon'
  className?: string
  iconSize?: number
}

function IsotipoSvg({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={Math.round(size * (72 / 68))}
      height={size}
      viewBox="14 18 72 68"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn('shrink-0', className)}
    >
      <path d="M14 18 L50 86 L86 18 L72 18 L50 60 L28 18 Z" fill="#00E676" />
      <path d="M28 18 L50 60 L72 18 L60 18 L50 38 L40 18 Z" fill="#00796B" />
    </svg>
  )
}

export function Logo({ variant = 'full', className, iconSize }: LogoProps) {
  const size = iconSize ?? (variant === 'icon' ? 32 : 28)

  if (variant === 'icon') {
    return (
      <svg
        width={Math.round(size * (72 / 68))}
        height={size}
        viewBox="14 18 72 68"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Ventix"
        className={cn('shrink-0', className)}
      >
        <path d="M14 18 L50 86 L86 18 L72 18 L50 60 L28 18 Z" fill="#00E676" />
        <path d="M28 18 L50 60 L72 18 L60 18 L50 38 L40 18 Z" fill="#00796B" />
      </svg>
    )
  }

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <IsotipoSvg size={size} />
      <span className="font-extrabold tracking-tight leading-none">Ventix</span>
    </span>
  )
}
