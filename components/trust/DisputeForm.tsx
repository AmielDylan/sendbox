'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

const REASONS = [
  'Colis non remis',
  'Colis endommagé à la livraison',
  'Colis perdu',
  'Voyageur absent au rendez-vous',
  'Expéditeur absent au rendez-vous',
  "Contenu non conforme à l'annonce",
  'Autre',
]

export function DisputeForm({
  transactionId,
  onSuccess,
}: {
  transactionId: string
  onSuccess: () => void
}) {
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!reason || description.length < 30) {
      setError(
        'Choisissez une raison et décrivez le problème (30 caractères minimum).'
      )
      return
    }

    setSubmitting(true)
    setError(null)

    const res = await fetch('/api/disputes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId, reason, description }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setError(data?.error ?? "Erreur lors de l'ouverture du litige.")
      setSubmitting(false)
      return
    }

    onSuccess()
  }

  return (
    <div className="flex flex-col gap-4">
      <Alert>
        <AlertDescription>
          Ce litige sera visible publiquement sur les deux profils pendant toute
          la durée de l&apos;instruction. Cette action est irréversible.
        </AlertDescription>
      </Alert>

      <div className="flex flex-col gap-1">
        <Label htmlFor="dispute-reason">Raison du litige</Label>
        <select
          id="dispute-reason"
          value={reason}
          onChange={event => setReason(event.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="">Sélectionner...</option>
          {REASONS.map(item => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="dispute-description">
          Description{' '}
          <span className="font-normal text-muted-foreground">
            ({description.length}/500)
          </span>
        </Label>
        <Textarea
          id="dispute-description"
          value={description}
          onChange={event => setDescription(event.target.value.slice(0, 500))}
          rows={4}
          placeholder="Décrivez précisément les faits, avec les dates et le contexte..."
          className="resize-none"
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button
        type="button"
        variant="destructive"
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? 'Ouverture en cours...' : 'Ouvrir le litige'}
      </Button>
    </div>
  )
}
