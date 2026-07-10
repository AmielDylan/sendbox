'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { IconInfoCircle } from '@tabler/icons-react'
import {
  DISPUTE_REASONS,
  getDisputeEvidenceChecklist,
} from '@/lib/core/disputes/policy'

export function DisputeForm({
  transactionId,
  onSuccess,
  context,
}: {
  transactionId: string
  onSuccess: () => void
  context?: string
}) {
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!reason || description.trim().length < 30) {
      setError(
        'Choisissez une raison et décrivez les faits (30 caractères minimum).'
      )
      return
    }

    setSubmitting(true)
    setError(null)

    const res = await fetch('/api/disputes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactionId,
        reason,
        description,
      }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setError(data?.error ?? "Erreur lors de l'ouverture du litige.")
      setSubmitting(false)
      return
    }

    onSuccess()
  }

  const evidenceChecklist = reason ? getDisputeEvidenceChecklist(reason) : []
  const selectedReason = DISPUTE_REASONS.find(item => item.code === reason)

  return (
    <div className="flex flex-col gap-4">
      <Alert>
        <IconInfoCircle className="h-4 w-4" />
        <AlertTitle>Avant d'ouvrir un litige</AlertTitle>
        <AlertDescription>
          {context ||
            'Expliquez les faits de manière vérifiable. Le litige sera visible sur les profils pendant son instruction.'}
        </AlertDescription>
      </Alert>

      <div className="flex flex-col gap-1">
        <Label htmlFor="dispute-reason">Raison du litige</Label>
        <Select value={reason} onValueChange={setReason}>
          <SelectTrigger id="dispute-reason">
            <SelectValue placeholder="Sélectionner une raison..." />
          </SelectTrigger>
          <SelectContent>
            {DISPUTE_REASONS.map(item => (
              <SelectItem key={item.code} value={item.code}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedReason ? (
          <p className="text-xs leading-5 text-muted-foreground">
            {selectedReason.description}
          </p>
        ) : null}
      </div>

      {evidenceChecklist.length > 0 ? (
        <div className="rounded-md border bg-muted/30 p-3">
          <p className="text-sm font-medium">Éléments utiles à fournir</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {evidenceChecklist.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

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
          placeholder="Décrivez les faits dans l'ordre : date, lieu, échanges, preuves disponibles, action attendue..."
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
