'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { FEATURES } from '@/lib/shared/config/features'

export default function WaitlistPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [betaCount, setBetaCount] = useState<number | null>(null)

  useEffect(() => {
    if (!FEATURES.BETA_MODE) return

    let isMounted = true
    const loadCount = async () => {
      try {
        const res = await fetch('/api/beta-stats')
        if (!res.ok) return
        const payload = await res.json()
        if (isMounted && typeof payload?.count === 'number') {
          setBetaCount(payload.count)
        }
      } catch {
        // ignore
      }
    }

    void loadCount()
    return () => {
      isMounted = false
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (res.ok) {
        toast.success('Inscription enregistrée !')
        setEmail('')
      } else {
        toast.error('Email déjà enregistré')
      }
    } catch {
      toast.error('Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-lg py-16">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-3xl">Liste d'attente</CardTitle>
            {FEATURES.BETA_MODE && (
              <Badge className="h-6 items-center rounded-full border border-amber-200 bg-amber-100 px-2 text-[10px] font-semibold uppercase tracking-wide text-amber-900 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
                Bêta · {typeof betaCount === 'number' ? betaCount : '…'}/
                {FEATURES.MAX_BETA_USERS}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            La beta est complète ({FEATURES.MAX_BETA_USERS} utilisateurs).
            Inscrivez-vous pour être notifié de l'ouverture publique.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Envoi...' : 'Rejoindre la liste'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
