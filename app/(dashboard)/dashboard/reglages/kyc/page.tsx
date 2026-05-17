'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  IconAlertCircle,
  IconCamera,
  IconCheck,
  IconClock,
  IconId,
  IconLoader2,
  IconShieldCheck,
  IconUpload,
} from '@tabler/icons-react'
import { createClient } from '@/lib/shared/db/client'

type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected'

type PageState =
  | { phase: 'loading' }
  | { phase: 'verified' }
  | { phase: 'pending' }
  | { phase: 'rejected'; reason: string | null }
  | { phase: 'form'; step: 1 | 2 }
  | { phase: 'success' }
  | { phase: 'error'; message: string }

type DocType = 'passport' | 'cni' | ''
type CountryCode =
  | 'FR'
  | 'BJ'
  | 'TG'
  | 'CI'
  | 'SN'
  | 'MA'
  | 'DZ'
  | 'TN'
  | 'CM'
  | 'other'
  | ''

const DOC_TYPES: { value: DocType; label: string }[] = [
  { value: 'passport', label: 'Passeport' },
  { value: 'cni', label: "Carte nationale d'identité" },
]

const COUNTRIES: { value: CountryCode; label: string }[] = [
  { value: 'FR', label: 'France' },
  { value: 'BJ', label: 'Bénin' },
  { value: 'TG', label: 'Togo' },
  { value: 'CI', label: "Côte d'Ivoire" },
  { value: 'SN', label: 'Sénégal' },
  { value: 'MA', label: 'Maroc' },
  { value: 'DZ', label: 'Algérie' },
  { value: 'TN', label: 'Tunisie' },
  { value: 'CM', label: 'Cameroun' },
  { value: 'other', label: 'Autre' },
]

const docHint: Record<NonNullable<Exclude<DocType, ''>>, string> = {
  passport:
    'Page principale ouverte (photo + informations). Passeport entier visible, fond uni, sans reflet.',
  cni: 'Recto de la carte. Pièce entière visible, fond uni, sans reflet.',
}

export default function KYCPage() {
  const router = useRouter()
  const [state, setState] = useState<PageState>({ phase: 'loading' })
  const [docType, setDocType] = useState<DocType>('')
  const [country, setCountry] = useState<CountryCode>('')
  const [customCountry, setCustomCountry] = useState('')
  const [docFile, setDocFile] = useState<File | null>(null)
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [docPreview, setDocPreview] = useState<string | null>(null)
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null)
  const [consent, setConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const docInputRef = useRef<HTMLInputElement>(null)
  const selfieInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('verification_status, kyc_rejection_reason')
        .eq('id', user.id)
        .single()

      const status: VerificationStatus = (profile?.verification_status ??
        'none') as VerificationStatus
      if (status === 'verified') {
        setState({ phase: 'verified' })
        setTimeout(() => router.push('/dashboard'), 1500)
      } else if (status === 'pending') {
        setState({ phase: 'pending' })
      } else if (status === 'rejected') {
        setState({
          phase: 'rejected',
          reason: (profile as any)?.kyc_rejection_reason ?? null,
        })
      } else {
        setState({ phase: 'form', step: 1 })
      }
    }
    load()
  }, [router])

  function handleDocChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setDocFile(file)
    if (file) setDocPreview(URL.createObjectURL(file))
    else setDocPreview(null)
  }

  function handleSelfieChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setSelfieFile(file)
    if (file) setSelfiePreview(URL.createObjectURL(file))
    else setSelfiePreview(null)
  }

  async function handleSubmit() {
    if (!docFile || !selfieFile || !consent) return
    setSubmitting(true)
    try {
      const body = new FormData()
      body.append('docFile', docFile)
      body.append('selfieFile', selfieFile)
      body.append('consent', 'true')
      if (docType) body.append('docType', docType)
      if (country) body.append('country', country)
      if (country === 'other' && customCountry.trim())
        body.append('customCountry', customCountry.trim())

      const res = await fetch('/api/kyc/submit', { method: 'POST', body })
      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.error || 'Erreur lors de la soumission')
      }
      setState({ phase: 'success' })
    } catch (err) {
      setState({
        phase: 'error',
        message: err instanceof Error ? err.message : 'Erreur inattendue',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const countryReady =
    !!country && (country !== 'other' || !!customCountry.trim())
  const canProceedStep1 = !!docType && countryReady && !!docFile && consent

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vérification d'identité"
        description="Soumettez votre pièce d'identité pour accéder à toutes les fonctionnalités"
        breadcrumbs={[
          { label: 'Réglages', href: '/dashboard/reglages' },
          { label: 'Vérification KYC' },
        ]}
      />

      {state.phase === 'loading' && (
        <div className="flex items-center justify-center min-h-[300px]">
          <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {state.phase === 'verified' && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <IconShieldCheck className="h-5 w-5 text-green-600" />
          <AlertTitle>Identité vérifiée</AlertTitle>
          <AlertDescription>
            Votre identité a déjà été vérifiée. Redirection en cours…
          </AlertDescription>
        </Alert>
      )}

      {state.phase === 'pending' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <IconClock className="h-6 w-6 text-amber-500" />
              <CardTitle>Dossier en cours d&apos;examen</CardTitle>
            </div>
            <CardDescription>
              Notre équipe examine votre dossier. Ce processus prend
              généralement 24 à 48 heures.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Vous recevrez un email dès que votre identité sera vérifiée ou si
              des informations supplémentaires sont nécessaires.
            </p>
          </CardContent>
        </Card>
      )}

      {state.phase === 'rejected' && (
        <Alert variant="destructive">
          <IconAlertCircle className="h-5 w-5" />
          <AlertTitle>Vérification refusée</AlertTitle>
          <AlertDescription>
            {state.reason ? (
              <>
                Motif : <strong>{state.reason}</strong>
                <br />
              </>
            ) : null}
            Vous pouvez relancer la procédure en soumettant un nouveau dossier.
          </AlertDescription>
        </Alert>
      )}

      {(state.phase === 'rejected' || state.phase === 'form') && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Étape 1 : Document */}
          <Card
            className={
              state.phase === 'form' && state.step === 2 ? 'opacity-60' : ''
            }
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <IconId className="h-5 w-5 text-primary/80" />
                <CardTitle className="text-base">
                  Étape 1 : Pièce d&apos;identité
                </CardTitle>
              </div>
              <CardDescription>
                {docType
                  ? docHint[docType as Exclude<DocType, ''>]
                  : "Sélectionnez le type de pièce et le pays d'émission, puis prenez une photo nette sur fond uni."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Sélecteurs */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="doc-type">Type de pièce</Label>
                  <Select
                    value={docType}
                    onValueChange={v => setDocType(v as DocType)}
                  >
                    <SelectTrigger id="doc-type">
                      <SelectValue placeholder="Choisir…" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOC_TYPES.map(d => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="doc-country">Pays d&apos;émission</Label>
                  <Select
                    value={country}
                    onValueChange={v => setCountry(v as CountryCode)}
                  >
                    <SelectTrigger id="doc-country">
                      <SelectValue placeholder="Choisir…" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map(c => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {country === 'other' && (
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="custom-country">
                    Précisez le pays d&apos;émission
                  </Label>
                  <Input
                    id="custom-country"
                    value={customCountry}
                    onChange={e => setCustomCountry(e.target.value)}
                    placeholder="ex : Égypte, Cameroun, Congo-Brazzaville…"
                  />
                </div>
              )}

              {/* Upload document */}
              <input
                ref={docInputRef}
                type="file"
                accept="image/jpeg,image/png,image/heic"
                capture="environment"
                className="hidden"
                onChange={handleDocChange}
              />
              {docPreview ? (
                <div className="relative aspect-video overflow-hidden rounded-lg border">
                  <Image
                    src={docPreview}
                    alt="Aperçu document"
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => docInputRef.current?.click()}
                  disabled={!docType || !countryReady}
                  className="flex w-full flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border py-10 text-muted-foreground transition hover:border-primary/50 hover:text-primary disabled:pointer-events-none disabled:opacity-40"
                >
                  <IconUpload className="h-8 w-8" />
                  <span className="text-sm">
                    Prendre une photo ou choisir un fichier
                  </span>
                  <span className="text-xs text-muted-foreground/70">
                    JPG, PNG ou HEIC · max 10 Mo
                  </span>
                </button>
              )}
              {docPreview && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => docInputRef.current?.click()}
                >
                  Changer la photo
                </Button>
              )}

              <label className="flex items-start gap-3 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={e => setConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                />
                <span className="text-muted-foreground leading-5">
                  J&apos;accepte que mes données d&apos;identité soient traitées
                  par Sendbox dans le cadre de la vérification KYC, conformément
                  à la{' '}
                  <a
                    href="/legal/privacy"
                    className="underline hover:text-foreground"
                    target="_blank"
                    rel="noreferrer"
                  >
                    politique de confidentialité
                  </a>
                  . Les documents seront supprimés après vérification.
                </span>
              </label>

              {state.phase === 'form' && state.step === 1 && (
                <Button
                  className="w-full"
                  disabled={!canProceedStep1}
                  onClick={() => setState({ phase: 'form', step: 2 })}
                >
                  Continuer
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Étape 2 : Selfie */}
          <Card
            className={
              state.phase === 'form' && state.step === 1 ? 'opacity-60' : ''
            }
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <IconCamera className="h-5 w-5 text-primary/80" />
                <CardTitle className="text-base">
                  Étape 2 : Selfie avec la pièce
                </CardTitle>
              </div>
              <CardDescription>
                Prenez un selfie en tenant votre pièce d&apos;identité bien
                visible à côté de votre visage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                ref={selfieInputRef}
                type="file"
                accept="image/jpeg,image/png,image/heic"
                capture="user"
                className="hidden"
                onChange={handleSelfieChange}
              />
              {selfiePreview ? (
                <div className="relative aspect-video overflow-hidden rounded-lg border">
                  <Image
                    src={selfiePreview}
                    alt="Aperçu selfie"
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => selfieInputRef.current?.click()}
                  disabled={state.phase === 'form' && state.step === 1}
                  className="flex w-full flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border py-10 text-muted-foreground transition hover:border-primary/50 hover:text-primary disabled:pointer-events-none disabled:opacity-50"
                >
                  <IconCamera className="h-8 w-8" />
                  <span className="text-sm">
                    Prendre un selfie ou choisir un fichier
                  </span>
                  <span className="text-xs text-muted-foreground/70">
                    JPG, PNG ou HEIC · max 10 Mo
                  </span>
                </button>
              )}
              {selfiePreview && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selfieInputRef.current?.click()}
                >
                  Changer le selfie
                </Button>
              )}

              {(state.phase === 'rejected' ||
                (state.phase === 'form' && state.step === 2)) && (
                <Button
                  className="w-full"
                  disabled={!selfieFile || submitting}
                  onClick={handleSubmit}
                >
                  {submitting ? (
                    <>
                      <IconLoader2 className="h-4 w-4 animate-spin mr-2" />
                      Soumission en cours…
                    </>
                  ) : (
                    'Soumettre mon dossier'
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {state.phase === 'success' && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardHeader>
            <div className="flex items-center gap-3">
              <IconCheck className="h-6 w-6 text-green-600" />
              <CardTitle>Dossier soumis avec succès</CardTitle>
            </div>
            <CardDescription>
              Votre dossier est en cours d&apos;examen. Notre équipe vous
              contactera dans les 24 à 48 heures.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {state.phase === 'error' && (
        <div className="space-y-4">
          <Alert variant="destructive">
            <IconAlertCircle className="h-5 w-5" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
          <Button
            variant="outline"
            onClick={() => setState({ phase: 'form', step: 1 })}
          >
            Réessayer
          </Button>
        </div>
      )}
    </div>
  )
}
