/**
 * Navigation pour les pages de réglages
 */

'use client'

import { usePathname } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  IconUser,
  IconIdBadge2,
  IconUserShield,
  IconCreditCard,
  IconSparkles,
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
  const kycDescription =
    kycStatus === 'approved'
      ? 'Identité validée'
      : kycStatus === 'pending'
        ? 'Vérification en cours'
        : kycStatus === 'rejected'
          ? 'Action requise'
          : 'KYC et documents'

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
  }, [user?.id, initialKycStatus, supabase, isAdmin])

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
  }, [user?.id, supabase, isAdmin])

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
      label: 'Mon abonnement',
      href: '/dashboard/reglages/abonnement',
      icon: IconSparkles,
      description: 'Essai, accès publication et gestion',
      subscriptionOnly: true,
      userOnly: true,
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
      icon: IconUserShield,
      description: kycDescription,
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
    if (item.subscriptionOnly && !isFeatureEnabled('SUBSCRIPTION_ENABLED')) {
      return false
    }
    if (item.paymentsOnly && !isFeatureEnabled('STRIPE_PAYMENTS')) {
      return false
    }
    return true
  })

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
          </Link>
        )
      })}
    </nav>
  )
}
