import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'primary'
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
}

export function LoadingSpinner({
  className,
  size = 'md',
  variant = 'default',
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-current border-t-transparent',
        sizeClasses[size],
        variant === 'primary' && 'text-primary',
        className
      )}
      role="status"
      aria-label="Chargement en cours"
    >
      <span className="sr-only">Chargement en cours</span>
    </div>
  )
}








