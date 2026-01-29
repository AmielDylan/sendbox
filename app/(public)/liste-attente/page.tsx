'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { FEATURES } from '@/lib/shared/config/features'

export default function WaitlistPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

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
          <CardTitle className="text-3xl">Liste d'attente</CardTitle>
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
              onChange={(e) => setEmail(e.target.value)}
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
