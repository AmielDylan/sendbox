'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { IconChevronRight } from '@tabler/icons-react'
import { cn } from '@/lib/utils'

const sectionLabels: Record<string, string> = {
  compte: 'Compte',
  profil: 'Profil',
  kyc: "Vérification d'identité",
}

export function SettingsBreadcrumb({ className }: { className?: string }) {
  const pathname = usePathname()
  const sectionKey = pathname?.split('/').pop() || ''
  const sectionLabel = sectionLabels[sectionKey] || 'Réglages'

  return (
    <nav
      aria-label="Fil d'Ariane"
      className={cn(
        'flex items-center gap-2 text-xs text-muted-foreground',
        className
      )}
    >
      <Link
        href="/dashboard"
        className="hover:text-foreground transition-colors"
      >
        Dashboard
      </Link>
      <IconChevronRight className="h-3 w-3" aria-hidden="true" />
      <Link
        href="/dashboard/reglages"
        className="hover:text-foreground transition-colors"
      >
        Réglages
      </Link>
      <IconChevronRight className="h-3 w-3" aria-hidden="true" />
      <span className="text-foreground">{sectionLabel}</span>
    </nav>
  )
}
