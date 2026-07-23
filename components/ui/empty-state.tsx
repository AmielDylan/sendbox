import type { ReactNode } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: ReactNode
  imageSrc?: string
  imageAlt?: string
  title: string
  description: string
  action?: ReactNode
  className?: string
  imageClassName?: string
}

export function EmptyState({
  icon,
  imageSrc,
  imageAlt = '',
  title,
  description,
  action,
  className,
  imageClassName,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border/80 bg-background px-6 py-10 text-center shadow-none',
        className
      )}
    >
      {imageSrc ? (
        <div
          className={cn(
            'relative mb-1 h-28 w-28 overflow-hidden sm:h-32 sm:w-32',
            imageClassName
          )}
        >
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="160px"
            className="object-contain"
          />
        </div>
      ) : icon ? (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background text-muted-foreground shadow-sm ring-1 ring-border">
          {icon}
        </div>
      ) : null}
      <div className="max-w-sm space-y-2">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  )
}
