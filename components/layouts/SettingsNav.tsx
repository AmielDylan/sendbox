/**
 * Navigation pour les pages de réglages
 */

'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { IconUser, IconIdBadge2, IconShield, IconCircleCheck, IconClock, IconAlertCircle } from '@tabler/icons-react'
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
        <IconCircleCheck className="ml-auto h-4 w-4 text-green-600" />
      )
    }
    if (kycStatus === 'pending') {
      return (
        <Badge variant="secondary" className="ml-auto bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
          En attente
        </Badge>
      )
    }
    if (kycStatus === 'rejected') {
      return (
        <IconAlertCircle className="ml-auto h-4 w-4 text-destructive" />
      )
    }
    return null
  }

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href
        
        return (
          <Link key={item.href} href={item.href} className="block">
            <Button
              variant={isActive ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start',
                isActive && 'bg-secondary'
              )}
            >
              <Icon className="mr-2 h-4 w-4" />
              <div className="flex-1 text-left">
                <div className="font-medium">{item.label}</div>
                <div className="text-xs text-muted-foreground hidden sm:block">
                  {item.description}
                </div>
              </div>
              {item.badge && getKYCBadge()}
            </Button>
          </Link>
        )
      })}
    </nav>
  )
}





