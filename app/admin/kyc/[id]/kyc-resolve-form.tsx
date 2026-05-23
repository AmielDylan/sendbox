'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { IconLoader2 } from '@tabler/icons-react'

interface OcrFields {
  firstName: string | null
  lastName: string | null
  nationality: string | null
  birthDate: string | null
  expiryDate: string | null
  documentNumber: string | null
}

interface Props {
  userId: string
  profileName: string | null
  frontSignedUrl: string | null
  backSignedUrl: string | null
  documentType: string | null
}

const REJECTION_PRESETS = [
  'Photo floue ou illisible',
  'Pièce expirée',
  'Pièce non supportée',
  'Visage non visible sur le selfie',
  'Selfie et pièce ne correspondent pas',
  'Document incomplet ou tronqué',
]

const FIELD_LABELS: Record<keyof OcrFields, string> = {
  firstName: 'Prénom(s)',
  lastName: 'Nom',
  nationality: 'Nationalité',
  birthDate: 'Date de naissance',
  expiryDate: "Date d'expiration",
  documentNumber: 'N° document',
}

export function KYCResolveForm({
  userId,
  profileName,
  frontSignedUrl,
  backSignedUrl,
  documentType,
}: Props) {
  const router = useRouter()
  const [verifiedName, setVerifiedName] = useState(profileName ?? '')
  const [rejectionReason, setRejectionReason] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [loading, setLoading] = useState<'approve' | 'reject' | 'ocr' | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)
  const [ocrResult, setOcrResult] = useState<OcrFields | null>(null)
  const [ocrDetected, setOcrDetected] = useState<boolean | null>(null)

  function applyPreset(preset: string) {
    setRejectionReason(prev => {
      if (!prev.trim()) return preset
      if (prev.includes(preset)) return prev
      return `${prev.trim()}, ${preset}`
    })
  }

  async function extractOCR() {
    // For CNI: MRZ is on the back — use backSignedUrl if available
    const signedUrl =
      documentType === 'cni' && backSignedUrl ? backSignedUrl : frontSignedUrl
    if (!signedUrl) return
    setLoading('ocr')
    setError(null)
    setOcrDetected(null)
    setOcrResult(null)
    try {
      const docType = documentType === 'passport' ? 'PASSPORT' : 'CNI'
      const res = await fetch(`/api/admin/kyc/${userId}/ocr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedUrl, documentType: docType }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Erreur lors de l'extraction")
      setOcrDetected(json.detected ?? false)
      if (json.detected && json.valid && json.fields) {
        setOcrResult(json.fields)
        const name = [json.fields.firstName, json.fields.lastName]
          .filter(Boolean)
          .join(' ')
        if (name) setVerifiedName(name)
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de l'extraction OCR"
      )
    } finally {
      setLoading(null)
    }
  }

  async function resolve(outcome: 'VERIFIED' | 'REJECTED') {
    if (outcome === 'REJECTED' && !rejectionReason.trim()) {
      setError('Le motif de refus est obligatoire')
      return
    }
    setError(null)
    setLoading(outcome === 'VERIFIED' ? 'approve' : 'reject')
    try {
      const res = await fetch(`/api/admin/kyc/${userId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outcome,
          verifiedName: verifiedName.trim() || null,
          rejectionReason: rejectionReason.trim() || null,
          adminNotes: adminNotes.trim() || null,
        }),
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.error || 'Erreur lors de la résolution')
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inattendue')
    } finally {
      setLoading(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Décision admin</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Bouton extraction OCR */}
        <Button
          variant="outline"
          size="sm"
          disabled={!!loading || !frontSignedUrl}
          onClick={extractOCR}
        >
          {loading === 'ocr' ? (
            <IconLoader2 className="h-4 w-4 animate-spin mr-1.5" />
          ) : null}
          Extraire les informations
        </Button>

        {/* Résultat extraction impossible */}
        {ocrDetected === false && (
          <p className="text-sm text-amber-600">
            Extraction automatique impossible, vérification manuelle requise.
          </p>
        )}

        {/* Champs MRZ éditables */}
        {ocrResult && (
          <Card className="border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">
                Informations extraites (MRZ)
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {(Object.keys(FIELD_LABELS) as (keyof OcrFields)[]).map(key => (
                <div key={key} className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {FIELD_LABELS[key]}
                  </Label>
                  <Input
                    value={ocrResult[key] ?? ''}
                    onChange={e =>
                      setOcrResult(prev =>
                        prev ? { ...prev, [key]: e.target.value } : prev
                      )
                    }
                    className="text-xs h-8"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Nom vérifié */}
        <div className="space-y-2">
          <Label htmlFor="verified-name">Nom vérifié</Label>
          <Input
            id="verified-name"
            value={verifiedName}
            onChange={e => setVerifiedName(e.target.value)}
            placeholder="NOM Prénom tel qu'il figure sur la pièce"
          />
          {profileName && (
            <p className="text-xs text-muted-foreground pt-0.5">
              À l&apos;inscription :{' '}
              <span className="font-medium text-foreground">{profileName}</span>
            </p>
          )}
        </div>

        {/* Motif de refus */}
        <div className="space-y-2">
          <Label htmlFor="rejection-reason">
            Motif de refus{' '}
            <span className="text-muted-foreground text-xs">
              (transmis à l&apos;utilisateur)
            </span>
          </Label>
          <div className="flex flex-wrap gap-1.5 pb-1">
            {REJECTION_PRESETS.map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => applyPreset(preset)}
                className="inline-flex items-center rounded-full border border-border/70 bg-muted/50 px-2.5 py-0.5 text-xs text-muted-foreground transition hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
              >
                {preset}
              </button>
            ))}
          </div>
          <Textarea
            id="rejection-reason"
            value={rejectionReason}
            onChange={e => setRejectionReason(e.target.value)}
            placeholder="Sélectionnez un motif ci-dessus ou saisissez un motif personnalisé…"
            rows={3}
          />
        </div>

        {/* Notes internes */}
        <div className="space-y-2">
          <Label htmlFor="admin-notes">
            Notes internes{' '}
            <span className="text-muted-foreground text-xs">
              (non transmises à l&apos;utilisateur)
            </span>
          </Label>
          <Textarea
            id="admin-notes"
            value={adminNotes}
            onChange={e => setAdminNotes(e.target.value)}
            placeholder="Observations internes, contexte, doutes…"
            rows={2}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            className="flex-1"
            disabled={!!loading || !verifiedName.trim()}
            onClick={() => resolve('VERIFIED')}
          >
            {loading === 'approve' ? (
              <IconLoader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Valider l&apos;identité
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            disabled={!!loading}
            onClick={() => resolve('REJECTED')}
          >
            {loading === 'reject' ? (
              <IconLoader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Rejeter
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
