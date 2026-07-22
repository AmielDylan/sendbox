'use client'

import { cn } from '@/lib/utils'
import { IconChevronRight } from '@tabler/icons-react'
import Link from 'next/link'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: React.ReactNode
  className?: string
  titleClassName?: string
  descriptionClassName?: string
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
  titleClassName,
  descriptionClassName,
}: PageHeaderProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          aria-label="Fil d'Ariane"
          className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"
        >
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1
            return (
              <div key={index} className="flex items-center gap-1.5">
                {index > 0 && (
                  <IconChevronRight
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  />
                )}
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="rounded transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className={isLast ? 'text-foreground font-medium' : ''}>
                    {item.label}
                  </span>
                )}
              </div>
            )
          })}
        </nav>
      )}

      {/* Title and Description */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex-1 min-w-0 space-y-1">
          <h1
            className={cn(
              'break-words text-xl font-semibold tracking-tight text-foreground sm:text-2xl',
              titleClassName
            )}
          >
            {title}
          </h1>
          {description && (
            <p
              className={cn(
                'max-w-3xl break-words text-sm text-muted-foreground',
                descriptionClassName
              )}
            >
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex w-full flex-shrink-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
