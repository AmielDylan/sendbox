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
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          aria-label="Fil d'Ariane"
          className="flex items-center space-x-2 text-sm text-muted-foreground"
        >
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1
            return (
              <div key={index} className="flex items-center space-x-2">
                {index > 0 && (
                  <IconChevronRight className="h-4 w-4" aria-hidden="true" />
                )}
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex-1 min-w-0 space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground truncate">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground break-words">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
        )}
      </div>
    </div>
  )
}
