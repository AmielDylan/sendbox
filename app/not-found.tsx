/**
 * Page 404 - Not Found
 * Force dynamic rendering to avoid Supabase client errors during static generation
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { IconHome, IconSearch } from '@tabler/icons-react'

// Force dynamic rendering (cannot be statically generated due to auth context)
export const dynamic = 'force-dynamic'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-9xl font-bold text-primary">404</h1>
          <h2 className="text-2xl font-semibold text-foreground">
            Page non trouvée
          </h2>
          <p className="text-muted-foreground">
            Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/">
              <IconHome className="mr-2 h-5 w-5" />
              Retour à l'accueil
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/recherche">
              <IconSearch className="mr-2 h-5 w-5" />
              Rechercher un trajet
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
