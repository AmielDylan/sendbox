/**
 * Page d'accueil du dashboard
 */

import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/page-header'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, MessageSquare, TrendingUp, Shield, CheckCircle2, Clock } from 'lucide-react'
import { KYCAlertBanner } from '@/components/features/kyc/KYCAlertBanner'
import { isFeatureEnabled } from '@/lib/config/features'

async function DashboardContent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let kycStatus = null
  let kycRejectionReason = null
  
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('kyc_status, kyc_rejection_reason')
      .eq('id', user.id)
      .single()
    
    kycStatus = profile?.kyc_status || null
    kycRejectionReason = profile?.kyc_rejection_reason || null
  }

  return (
    <>
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
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {kycStatus === 'approved' && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium text-sm">Compte vérifié</span>
                </div>
              )}
              {kycStatus === 'pending' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-yellow-600">
                    <Clock className="h-5 w-5" />
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
            <Package className="h-4 w-4 text-muted-foreground" />
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
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">3 non lus</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Colis envoyés</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">+12% ce mois-ci</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
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
    </>
  )
}

export default function DashboardPage() {
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
              <Package className="mr-2 h-4 w-4" />
              Nouvelle annonce
            </Link>
          </Button>
        }
      />

      <Suspense fallback={<div>Chargement...</div>}>
        <DashboardContent />
      </Suspense>
    </div>
  )
}
