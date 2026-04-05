'use client'

import { PageHeader } from '@/components/ui/page-header'
import { SubscriptionStatusPanel } from '@/components/features/subscriptions/SubscriptionStatusPanel'

export default function SubscriptionSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Mon abonnement"
        description="Pilotez votre accès à la publication, votre essai et la gestion de votre offre voyageur."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Réglages', href: '/dashboard/reglages' },
          { label: 'Mon abonnement' },
        ]}
      />

      <SubscriptionStatusPanel variant="page" />
    </div>
  )
}
