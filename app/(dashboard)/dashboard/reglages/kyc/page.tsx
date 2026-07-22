'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
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
import { useAuth } from '@/hooks/use-auth'
import { useAuthStore } from '@/lib/stores/auth-store'
import {
  KYCUploadDrawer,
  type UploadMode,
} from '@/components/features/kyc/KYCUploadDrawer'

type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected'

const PROFILE_FALLBACK_DELAY_MS = 3_000

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

const FIELD_LABELS = {
  cni: {
    front: {
      title: 'Recto',
      description: 'Face avec votre photo',
    },
    back: {
      title: 'Verso',
      description: 'Face avec les deux lignes de caractères en bas de la carte',
      required: true,
    },
  },
  passport: {
    front: {
      title: 'Page principale',
      description:
        'Page avec votre photo et les deux lignes de caractères en bas',
    },
    back: {
      title: 'Page suivante',
      description:
        'Page suivante si les lignes de caractères sont sur une page séparée',
      required: false,
    },
  },
} as const

async function compressImage(file: File): Promise<File> {
  const isHeic =
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    file.name.toLowerCase().endsWith('.heic') ||
    file.name.toLowerCase().endsWith('.heif')
  // HEIC cannot be re-encoded via Canvas; small files don't need compression
  if (isHeic || file.size <= 1 * 1024 * 1024) return file

  return new Promise(resolve => {
    const img = new window.Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const MAX_DIM = 1920
      let { width: w, height: h } = img
      if (w > MAX_DIM || h > MAX_DIM) {
        const r = Math.min(MAX_DIM / w, MAX_DIM / h)
        w = Math.round(w * r)
        h = Math.round(h * r)
      }
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      canvas.toBlob(
        blob =>
          resolve(
            blob
              ? new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
                  type: 'image/jpeg',
                })
              : file
          ),
        'image/jpeg',
        0.82
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(file)
    }
    img.src = url
  })
}

export default function KYCPage() {
  const router = useRouter()
  const { user, loading, profile, refetch } = useAuth()
  const setProfile = useAuthStore(state => state.setProfile)
  const [state, setState] = useState<PageState>({ phase: 'loading' })
  const [docType, setDocType] = useState<DocType>('')
  const [country, setCountry] = useState<CountryCode>('')
  const [customCountry, setCustomCountry] = useState('')
  const [frontFile, setFrontFile] = useState<File | null>(null)
  const [backFile, setBackFile] = useState<File | null>(null)
  const [frontPreview, setFrontPreview] = useState<string | null>(null)
  const [backPreview, setBackPreview] = useState<string | null>(null)
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null)
  const [consent, setConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [drawerTarget, setDrawerTarget] = useState<
    'front' | 'back' | 'selfie' | null
  >(null)
  // Camera inputs (with capture)
  const frontCameraRef = useRef<HTMLInputElement>(null)
  const backCameraRef = useRef<HTMLInputElement>(null)
  const selfieCameraRef = useRef<HTMLInputElement>(null)
  // Gallery/file inputs (without capture)
  const frontGalleryRef = useRef<HTMLInputElement>(null)
  const backGalleryRef = useRef<HTMLInputElement>(null)
  const selfieGalleryRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let isActive = true
    const abortController = new AbortController()

    if (!loading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      const applyStatus = (
        status: VerificationStatus,
        rejectionReason: string | null
      ) => {
        if (!isActive) return

        if (status === 'verified') {
          setState({ phase: 'verified' })
        } else if (status === 'pending') {
          setState({ phase: 'pending' })
        } else if (status === 'rejected') {
          setState({ phase: 'rejected', reason: rejectionReason })
        } else {
          setState({ phase: 'form', step: 1 })
        }
      }

      const timeoutId = window.setTimeout(() => {
        if (isActive) {
          setState({ phase: 'form', step: 1 })
        }
      }, PROFILE_FALLBACK_DELAY_MS)

      async function loadStatus() {
        try {
          const response = await fetch('/api/kyc/status', {
            cache: 'no-store',
            signal: abortController.signal,
          })

          if (!isActive) return

          if (response.status === 401) {
            router.push('/login')
            return
          }

          if (!response.ok) {
            return
          }

          const payload = (await response.json()) as {
            status?: VerificationStatus
            rejectionReason?: string | null
          }

          window.clearTimeout(timeoutId)
          applyStatus(payload.status || 'none', payload.rejectionReason ?? null)
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') return
        }
      }

      loadStatus()

      return () => {
        isActive = false
        window.clearTimeout(timeoutId)
        abortController.abort()
      }
    }

    return () => {
      isActive = false
      abortController.abort()
    }
  }, [loading, router, user])

  function handleFrontChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setFrontFile(file)
    setFrontPreview(file ? URL.createObjectURL(file) : null)
    e.target.value = ''
  }

  function handleBackChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setBackFile(file)
    setBackPreview(file ? URL.createObjectURL(file) : null)
    e.target.value = ''
  }

  function handleSelfieChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setSelfieFile(file)
    setSelfiePreview(file ? URL.createObjectURL(file) : null)
    e.target.value = ''
  }

  function handleDrawerSelect(mode: UploadMode) {
    if (!drawerTarget) return
    const cameraRefs = {
      front: frontCameraRef,
      back: backCameraRef,
      selfie: selfieCameraRef,
    }
    const galleryRefs = {
      front: frontGalleryRef,
      back: backGalleryRef,
      selfie: selfieGalleryRef,
    }
    const ref =
      mode === 'camera' ? cameraRefs[drawerTarget] : galleryRefs[drawerTarget]
    ref.current?.click()
    setDrawerTarget(null)
  }

  async function handleSubmit() {
    if (!frontFile || !selfieFile || !consent) return
    setSubmitting(true)
    try {
      const [cFront, cSelfie] = await Promise.all([
        compressImage(frontFile),
        compressImage(selfieFile),
      ])
      const cBack = backFile ? await compressImage(backFile) : null

      const body = new FormData()
      body.append('frontFile', cFront)
      if (cBack) body.append('backFile', cBack)
      body.append('selfieFile', cSelfie)
      body.append('consent', 'true')
      if (docType) body.append('documentType', docType)
      if (country) body.append('country', country)
      if (country === 'other' && customCountry.trim())
        body.append('customCountry', customCountry.trim())

      const res = await fetch('/api/kyc/submit', { method: 'POST', body })
      if (!res.ok) {
        const raw = await res.text().catch(() => '')
        let message = `Erreur ${res.status}`
        try {
          const payload = JSON.parse(raw)
          if (payload?.error) message = `[${res.status}] ${payload.error}`
        } catch {}
        console.error('[kyc/submit]', res.status, raw.slice(0, 500))
        throw new Error(message)
      }
      if (profile) {
        setProfile({
          ...profile,
          kyc_status: 'pending',
          verification_status: 'pending',
          kyc_submitted_at: new Date().toISOString(),
          kyc_rejection_reason: null,
        } as any)
      }
      void refetch().catch(error => {
        console.warn('[kyc/submit] Profile refetch after submit failed:', error)
      })
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

  const backRequired = docType === 'cni'
  const countryReady =
    !!country && (country !== 'other' || !!customCountry.trim())
  const canProceedStep1 =
    !!docType &&
    countryReady &&
    !!frontFile &&
    (!backRequired || !!backFile) &&
    consent

  const fieldLabels = docType ? FIELD_LABELS[docType] : null

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
        <div className="rounded-md bg-green-800 dark:bg-green-900 p-6 text-white">
          <div className="flex items-start gap-4">
            <IconShieldCheck className="h-5 w-5 mt-0.5 shrink-0 text-green-300" />
            <div className="space-y-1">
              <p className="font-semibold text-sm">Identité vérifiée</p>
              <p className="text-sm text-green-200">
                Votre identité a été confirmée. Vous pouvez publier des trajets
                et accepter des colis.
              </p>
            </div>
          </div>
          <div className="mt-4 pl-9">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-green-600 text-green-100 hover:bg-green-700 hover:text-white"
            >
              <Link href="/dashboard">Retour au tableau de bord</Link>
            </Button>
          </div>
        </div>
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
              Vous recevrez une notification dès que votre identité sera
              vérifiée ou si des informations supplémentaires sont nécessaires.
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
                {fieldLabels
                  ? `Pièce entière visible sur fond uni, sans reflet.`
                  : "Sélectionnez le type de pièce et le pays d'émission, puis chargez les photos."}
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

              {/* Hidden inputs recto */}
              <input
                ref={frontCameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFrontChange}
              />
              <input
                ref={frontGalleryRef}
                type="file"
                accept="image/jpeg,image/png,image/heic"
                className="hidden"
                onChange={handleFrontChange}
              />
              {/* Hidden inputs verso */}
              <input
                ref={backCameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleBackChange}
              />
              <input
                ref={backGalleryRef}
                type="file"
                accept="image/jpeg,image/png,image/heic"
                className="hidden"
                onChange={handleBackChange}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Recto / Page principale */}
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">
                    {fieldLabels ? fieldLabels.front.title : 'Recto'}
                  </p>
                  <p className="text-xs text-muted-foreground min-h-[2.5rem]">
                    {fieldLabels?.front.description ?? ''}
                  </p>
                  {frontPreview ? (
                    <div className="relative aspect-video overflow-hidden rounded-lg border">
                      <Image
                        src={frontPreview}
                        alt="Aperçu recto"
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDrawerTarget('front')}
                      disabled={!docType || !countryReady}
                      className="flex w-full flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border py-8 text-muted-foreground transition hover:border-primary/50 hover:text-primary disabled:pointer-events-none disabled:opacity-40"
                    >
                      <IconUpload className="h-7 w-7" />
                      <span className="text-xs">
                        Photo ou fichier
                        <br />
                        JPG, PNG ou HEIC · max 10 Mo
                      </span>
                    </button>
                  )}
                  {frontPreview && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDrawerTarget('front')}
                    >
                      Changer la photo
                    </Button>
                  )}
                </div>

                {/* Verso / Page suivante */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">
                      {fieldLabels ? fieldLabels.back.title : 'Verso'}
                    </p>
                    {fieldLabels && !fieldLabels.back.required && (
                      <Badge variant="secondary" className="text-[10px] h-5">
                        Optionnel
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground min-h-[2.5rem]">
                    {fieldLabels?.back.description ?? ''}
                  </p>
                  {backPreview ? (
                    <div className="relative aspect-video overflow-hidden rounded-lg border">
                      <Image
                        src={backPreview}
                        alt="Aperçu verso"
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDrawerTarget('back')}
                      disabled={!docType || !countryReady}
                      className="flex w-full flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border py-8 text-muted-foreground transition hover:border-primary/50 hover:text-primary disabled:pointer-events-none disabled:opacity-40"
                    >
                      <IconUpload className="h-7 w-7" />
                      <span className="text-xs">
                        Photo ou fichier
                        <br />
                        JPG, PNG ou HEIC · max 10 Mo
                      </span>
                    </button>
                  )}
                  {backPreview && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDrawerTarget('back')}
                    >
                      Changer la photo
                    </Button>
                  )}
                </div>
              </div>

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
              {/* Hidden inputs selfie */}
              <input
                ref={selfieCameraRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={handleSelfieChange}
              />
              <input
                ref={selfieGalleryRef}
                type="file"
                accept="image/jpeg,image/png,image/heic"
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
                  onClick={() => setDrawerTarget('selfie')}
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
                  onClick={() => setDrawerTarget('selfie')}
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

      <KYCUploadDrawer
        open={drawerTarget !== null}
        onOpenChange={open => {
          if (!open) setDrawerTarget(null)
        }}
        onSelect={handleDrawerSelect}
        title={
          drawerTarget === 'selfie'
            ? 'Ajouter un selfie'
            : drawerTarget === 'front'
              ? 'Ajouter le recto'
              : 'Ajouter le verso'
        }
        description="JPG, PNG ou HEIC · max 10 Mo"
      />
    </div>
  )
}
