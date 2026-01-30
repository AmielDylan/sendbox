/**
 * Navigation pour les pages de réglages
 */

'use client'

import { usePathname } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import {
  IconUser,
  IconIdBadge2,
  IconShield,
  IconCreditCard,
  IconCircleCheck,
  IconAlertCircle,
  IconClock,
} from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { isFeatureEnabled } from '@/lib/shared/config/features'
import { createClient } from '@/lib/shared/db/client'
import { useAuth } from '@/hooks/use-auth'

interface SettingsNavProps {
  kycStatus?: 'pending' | 'approved' | 'rejected' | 'incomplete' | null
}

export function SettingsNav({ kycStatus: initialKycStatus }: SettingsNavProps) {
  const pathname = usePathname()
  const { user, profile } = useAuth()
  const supabase = useMemo(() => createClient(), [])
  const [kycStatus, setKycStatus] = useState<
    'pending' | 'approved' | 'rejected' | 'incomplete' | null
  >(initialKycStatus || null)
  const isAdmin = profile?.role === 'admin'

  // Charger le statut initial si non fourni
  useEffect(() => {
    if (!user?.id || initialKycStatus !== undefined || isAdmin) return

    const loadKycStatus = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('kyc_status')
        .eq('id', user.id)
        .single()

      if (profile) {
        setKycStatus(profile.kyc_status as any)
      }
    }

    loadKycStatus()
  }, [user?.id, initialKycStatus, supabase])

  // Subscription Realtime pour KYC status
  useEffect(() => {
    if (!user?.id || isAdmin) return

    console.log(
      '🔔 [SettingsNav] Subscribing to KYC updates for user:',
      user.id
    )

    const channel = supabase
      .channel(`settings-nav-kyc:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        payload => {
          console.log('🔔 [SettingsNav] Realtime UPDATE received:', payload)
          const nextProfile = payload.new as {
            kyc_status?:
              | 'pending'
              | 'approved'
              | 'rejected'
              | 'incomplete'
              | null
          }
          console.log(
            '📊 [SettingsNav] New KYC status:',
            nextProfile.kyc_status
          )
          setKycStatus(nextProfile.kyc_status ?? null)
        }
      )
      .subscribe(status => {
        console.log('📡 [SettingsNav] Realtime subscription status:', status)
      })

    return () => {
      console.log('🔌 [SettingsNav] Unsubscribing from KYC updates')
      supabase.removeChannel(channel)
    }
  }, [user?.id, supabase])

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
      label: 'Ajouter un compte bancaire',
      href: '/dashboard/reglages/paiements',
      icon: IconCreditCard,
      description: 'Recevoir vos paiements',
      paymentsOnly: true,
      userOnly: true,
    },
    {
      label: "Vérification d'identité",
      href: '/dashboard/reglages/kyc',
      icon: IconShield,
      description: 'KYC et documents',
      badge: kycStatus,
      kycOnly: true, // Marqueur pour filtrage conditionnel
      userOnly: true,
    },
  ]

  // Filtrer les items selon les feature flags
  const navItems = allNavItems.filter(item => {
    if (item.userOnly && isAdmin) {
      return false
    }
    if (item.kycOnly && !isFeatureEnabled('KYC_ENABLED')) {
      return false // Masquer KYC si désactivé
    }
    if (item.paymentsOnly && !isFeatureEnabled('STRIPE_PAYMENTS')) {
      return false
    }
    return true
  })

  const getKYCBadge = () => {
    if (kycStatus === 'approved') {
      return (
        <Badge
          variant="secondary"
          className="ml-auto bg-emerald-50 text-emerald-700"
        >
          <IconCircleCheck className="mr-1 h-3 w-3" />
          Validé
        </Badge>
      )
    }
    if (kycStatus === 'pending') {
      return (
        <Badge variant="warning" className="ml-auto">
          <IconClock className="mr-1 h-3 w-3" />
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
      {navItems.map(item => {
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
