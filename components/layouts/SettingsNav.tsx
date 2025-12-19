/**
 * Navigation pour les pages de réglages
 */

'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User, IdCard, Shield, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SettingsNavProps {
  kycStatus?: 'pending' | 'approved' | 'rejected' | null
}

export function SettingsNav({ kycStatus }: SettingsNavProps) {
  const pathname = usePathname()

  const navItems = [
    {
      label: 'Mon compte',
      href: '/dashboard/reglages/compte',
      icon: User,
      description: 'Email, mot de passe et sécurité',
    },
    {
      label: 'Profil',
      href: '/dashboard/reglages/profil',
      icon: IdCard,
      description: 'Informations personnelles',
    },
    {
      label: 'Vérification d\'identité',
      href: '/dashboard/reglages/kyc',
      icon: Shield,
      description: 'KYC et documents',
      badge: kycStatus,
    },
  ]

  const getKYCBadge = () => {
    if (kycStatus === 'approved') {
      return (
        <CheckCircle2 className="ml-auto h-4 w-4 text-green-600" />
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
        <AlertCircle className="ml-auto h-4 w-4 text-destructive" />
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
              {item.badge === 'kyc' && getKYCBadge()}
              {item.badge && item.badge !== 'kyc' && getKYCBadge()}
            </Button>
          </Link>
        )
      })}
    </nav>
  )
}

