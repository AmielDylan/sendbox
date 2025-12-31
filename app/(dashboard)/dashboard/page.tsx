/**
 * Page d'accueil du dashboard
 */

'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from "@/lib/shared/db/client"
import { PageHeader } from '@/components/ui/page-header'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { IconPackage, IconMessage, IconTrendingUp, IconShield, IconCheck, IconClock } from '@tabler/icons-react'
import { KYCAlertBanner } from '@/components/features/kyc/KYCAlertBanner'
import { isFeatureEnabled } from "@/lib/shared/config/features"
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import type { KYCStatus } from '@/types'

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null)
  const [kycRejectionReason, setKycRejectionReason] = useState<string | null>(null)

  useEffect(() => {
    // Gérer l'alert de vérification email
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('verified') === 'true') {
        toast.success('Compte vérifié avec succès!', {
          description: 'Vous pouvez maintenant utiliser toutes les fonctionnalités'
        })
        window.history.replaceState({}, '', '/dashboard')
      }
    }

    // Charger le statut KYC
    const loadKycStatus = async () => {
      if (profile) {
        setKycStatus((profile as any).kyc_status as KYCStatus)
        setKycRejectionReason((profile as any).kyc_rejection_reason || null)
      }
    }

    loadKycStatus()
  }, [user?.id, profile])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de votre activité Sendbox"
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Tableau de bord' },
        ]}
        actions={
          <Button asChild>
            <Link href="/dashboard/annonces/new">
              <IconPackage className="mr-2 h-4 w-4" />
              Nouvelle annonce
            </Link>
          </Button>
        }
      />

      {/* Alert Banner KYC - SEULEMENT si feature activée */}
      {isFeatureEnabled('KYC_ENABLED') && (
        <KYCAlertBanner kycStatus={kycStatus} rejectionReason={kycRejectionReason} />
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Card KYC Status - SEULEMENT si feature activée */}
        {isFeatureEnabled('KYC_ENABLED') && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Vérification d'identité
              </CardTitle>
              <IconShield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {kycStatus === 'approved' && (
                <div className="flex items-center gap-2 text-green-600">
                  <IconCheck className="h-5 w-5" />
                  <span className="font-medium text-sm">Compte vérifié</span>
                </div>
              )}
              {kycStatus === 'pending' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-yellow-600">
                    <IconClock className="h-5 w-5" />
                    <span className="font-medium text-sm">En cours</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    24-48h
                  </p>
                </div>
              )}
              {(!kycStatus || kycStatus === 'rejected') && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Vérifiez votre identité
                  </p>
                  <Button asChild size="sm" variant="outline" className="w-full">
                    <Link href="/dashboard/reglages/kyc">
                      Commencer →
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Annonces actives
            </CardTitle>
            <IconPackage className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +2 depuis le mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <IconMessage className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">3 non lus</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Colis envoyés</CardTitle>
            <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">+12% ce mois-ci</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus</CardTitle>
            <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€2,450</div>
            <p className="text-xs text-muted-foreground">+8% ce mois-ci</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Activité récente</CardTitle>
          <CardDescription>
            Vos dernières interactions sur la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Nouvelle réservation reçue
                </p>
                <p className="text-xs text-muted-foreground">Il y a 2 heures</p>
              </div>
              <Button variant="outline" size="sm">
                Voir
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Message de Jean Dupont</p>
                <p className="text-xs text-muted-foreground">Il y a 5 heures</p>
              </div>
              <Button variant="outline" size="sm">
                Répondre
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
