/**
 * Navigation pour les pages de réglages
 */

'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { IconUser, IconIdBadge2, IconShield, IconCircleCheck, IconAlertCircle } from '@tabler/icons-react'
import { cn } from "@/lib/utils"
import { isFeatureEnabled } from "@/lib/shared/config/features"

interface SettingsNavProps {
  kycStatus?: 'pending' | 'approved' | 'rejected' | 'incomplete' | null
}

export function SettingsNav({ kycStatus }: SettingsNavProps) {
  const pathname = usePathname()

  const allNavItems = [
    {
      label: 'Mon compte',
      href: '/dashboard/reglages/compte',
      icon: IconUser,
      description: 'Email, mot de passe et sécurité',
    },
    {
      label: 'Profil',
      href: '/dashboard/reglages/profil',
      icon: IconIdBadge2,
      description: 'Informations personnelles',
    },
    {
      label: 'Vérification d\'identité',
      href: '/dashboard/reglages/kyc',
      icon: IconShield,
      description: 'KYC et documents',
      badge: kycStatus,
      kycOnly: true, // Marqueur pour filtrage conditionnel
    },
  ]

  // Filtrer les items selon les feature flags
  const navItems = allNavItems.filter(item => {
    if (item.kycOnly && !isFeatureEnabled('KYC_ENABLED')) {
      return false // Masquer KYC si désactivé
    }
    return true
  })

  const getKYCBadge = () => {
    if (kycStatus === 'approved') {
      return (
        <Badge variant="secondary" className="ml-auto bg-emerald-50 text-emerald-700">
          <IconCircleCheck className="mr-1 h-3 w-3" />
          Validé
        </Badge>
      )
    }
    if (kycStatus === 'pending') {
      return (
        <Badge variant="secondary" className="ml-auto bg-yellow-100 text-yellow-700">
          En attente
        </Badge>
      )
    }
    if (kycStatus === 'rejected') {
      return (
        <Badge variant="destructive" className="ml-auto">
          <IconAlertCircle className="mr-1 h-3 w-3" />
          Rejeté
        </Badge>
      )
    }
    return null
  }

  return (
    <nav className="space-y-1 p-2">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-start gap-3 rounded-sm px-3 py-2 text-sm transition-colors',
              isActive
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className="mt-0.5 h-4 w-4 text-current" />
            <div className="flex-1 text-left">
              <div className="font-medium">{item.label}</div>
              <div className="text-xs text-muted-foreground hidden sm:block">
                {item.description}
              </div>
            </div>
            {item.badge && getKYCBadge()}
          </Link>
        )
      })}
    </nav>
  )
}



