/**
 * Page KYC dans les réglages
 */

'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { kycSchema, type KYCInput, DOCUMENT_TYPES } from "@/lib/core/kyc/validations"
import { submitKYC, getKYCStatus } from "@/lib/core/kyc/actions"
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { IconLoader2, IconCircleCheck, IconCircleX, IconClock, IconUpload } from '@tabler/icons-react'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

type KYCStatus = 'pending' | 'approved' | 'rejected' | 'incomplete' | null

export default function KYCPage() {
  const [kycStatus, setKycStatus] = useState<KYCStatus>(null)
  const [submittedAt, setSubmittedAt] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [uploadProgress, setUploadProgress] = useState({ front: 0, back: 0 })
  const [isUploading, setIsUploading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<KYCInput>({
    resolver: zodResolver(kycSchema),
  })

  const documentType = watch('documentType')

  useEffect(() => {
    loadKYCStatus()
  }, [])

  const loadKYCStatus = async () => {
    setIsLoading(true)
    try {
      const result = await getKYCStatus()
      if (result.error) {
        toast.error(result.error)
      } else {
        setKycStatus(result.status as KYCStatus)
        setSubmittedAt(result.submittedAt || null)
      }
    } catch (error) {
      toast.error('Erreur lors du chargement du statut KYC')
    } finally {
      setIsLoading(false)
    }
  }

  const simulateProgress = (field: 'front' | 'back') => {
    setIsUploading(true)
    let progress = 0
    const interval = setInterval(() => {
      progress += 10
      setUploadProgress(prev => ({ ...prev, [field]: Math.min(progress, 90) }))
      if (progress >= 90) {
        clearInterval(interval)
      }
    }, 200)
    return interval
  }

  const onSubmit = async (data: KYCInput) => {
    setIsSubmitting(true)
    setUploadProgress({ front: 0, back: 0 })
    
    try {
      // Simuler progression upload
      const frontInterval = simulateProgress('front')
      const backInterval = data.documentBack ? simulateProgress('back') : null

      const formData = new FormData()
      formData.append('documentType', data.documentType)
      formData.append('documentNumber', data.documentNumber)
      formData.append('documentFront', data.documentFront)
      if (data.documentBack) {
        formData.append('documentBack', data.documentBack)
      }
      formData.append('birthday', data.birthday.toISOString())
      formData.append('nationality', data.nationality)
      formData.append('address', data.address)

      const result = await submitKYC(formData)

      // Compléter la progression
      clearInterval(frontInterval)
      if (backInterval) clearInterval(backInterval)
      setUploadProgress({ front: 100, back: 100 })

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.success) {
        toast.success(result.message)
        await loadKYCStatus()
      }
    } catch (error) {
      toast.error('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsSubmitting(false)
      setIsUploading(false)
      // Réinitialiser la progression après un délai
      setTimeout(() => {
        setUploadProgress({ front: 0, back: 0 })
      }, 2000)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const getStatusBadge = () => {
    switch (kycStatus) {
      case 'approved':
        return (
          <Badge variant="default" className="bg-green-500">
            <IconCircleCheck className="mr-1 h-3 w-3" />
            Approuvé
          </Badge>
        )
      case 'rejected':
        return (
          <Badge variant="destructive">
            <IconCircleX className="mr-1 h-3 w-3" />
            Rejeté
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant="secondary">
            <IconClock className="mr-1 h-3 w-3" />
            En attente
          </Badge>
        )
      case 'incomplete':
        return (
          <Badge variant="outline">
            <IconUpload className="mr-1 h-3 w-3" />
            À compléter
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vérification d'identité (KYC)"
        description="Vérifiez votre identité pour pouvoir créer des annonces et réserver des colis"
      />

      {/* Statut actuel */}
      <Card>
        <CardHeader>
          <CardTitle>Statut de votre KYC</CardTitle>
          <CardDescription>
            {kycStatus === 'approved' &&
              'Votre identité a été vérifiée. Vous pouvez créer des annonces.'}
            {kycStatus === 'pending' &&
              "Votre demande est en cours d'examen. Vous serez notifié par email."}
            {kycStatus === 'rejected' &&
              'Votre demande a été rejetée. Veuillez soumettre une nouvelle demande.'}
            {(kycStatus === 'incomplete' || !kycStatus) &&
              'Aucune demande KYC soumise. Complétez le formulaire ci-dessous.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {getStatusBadge()}
            {submittedAt && (
              <p className="text-sm text-muted-foreground">
                Soumis le {format(new Date(submittedAt), 'PP', { locale: fr })}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Formulaire KYC */}
      {(kycStatus === null || kycStatus === 'rejected' || kycStatus === 'incomplete') && (
        <Card>
          <CardHeader>
            <CardTitle>Formulaire de vérification</CardTitle>
            <CardDescription>
              Téléchargez vos documents d&apos;identité pour vérification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Type de document */}
              <div className="space-y-2">
                <Label htmlFor="documentType">Type de document</Label>
                <Select
                  onValueChange={value =>
                    setValue(
                      'documentType',
                      value as 'passport' | 'national_id'
                    )
                  }
                >
                  <SelectTrigger id="documentType">
                    <SelectValue placeholder="Sélectionnez un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        {type === 'passport'
                          ? 'Passeport'
                          : "Carte nationale d'identité"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.documentType && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.documentType.message}
                  </p>
                )}
              </div>

              {/* Numéro de document */}
              <div className="space-y-2">
                <Label htmlFor="documentNumber">Numéro de document</Label>
                <Input
                  id="documentNumber"
                  placeholder="AB123456"
                  {...register('documentNumber')}
                  aria-invalid={errors.documentNumber ? 'true' : 'false'}
                  aria-describedby={
                    errors.documentNumber ? 'documentNumber-error' : undefined
                  }
                />
                {errors.documentNumber && (
                  <p
                    id="documentNumber-error"
                    className="text-sm text-destructive"
                    role="alert"
                  >
                    {errors.documentNumber.message}
                  </p>
                )}
              </div>

              {/* Date de naissance */}
              <div className="space-y-2">
                <Label>Date de naissance</Label>
                <div className="flex flex-col gap-2">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={selectedDate => {
                      setDate(selectedDate)
                      if (selectedDate) {
                        setValue('birthday', selectedDate)
                      }
                    }}
                    disabled={date =>
                      date > new Date() || date < new Date('1900-01-01')
                    }
                    className="rounded-md border"
                  />
                  {date && (
                    <p className="text-sm text-muted-foreground">
                      {format(date, 'PP', { locale: fr })}
                    </p>
                  )}
                </div>
                {errors.birthday && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.birthday.message}
                  </p>
                )}
              </div>

              {/* Nationalité */}
              <div className="space-y-2">
                <Label htmlFor="nationality">Nationalité</Label>
                <Input
                  id="nationality"
                  placeholder="FR ou FRA"
                  {...register('nationality')}
                  aria-invalid={errors.nationality ? 'true' : 'false'}
                  aria-describedby={
                    errors.nationality ? 'nationality-error' : undefined
                  }
                />
                {errors.nationality && (
                  <p
                    id="nationality-error"
                    className="text-sm text-destructive"
                    role="alert"
                  >
                    {errors.nationality.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Code pays ISO 3166-1 (ex: FR, FRA, BEN)
                </p>
              </div>

              {/* Adresse */}
              <div className="space-y-2">
                <Label htmlFor="address">Adresse complète</Label>
                <Input
                  id="address"
                  placeholder="123 Rue Example, 75001 Paris, France"
                  {...register('address')}
                  aria-invalid={errors.address ? 'true' : 'false'}
                  aria-describedby={
                    errors.address ? 'address-error' : undefined
                  }
                />
                {errors.address && (
                  <p
                    id="address-error"
                    className="text-sm text-destructive"
                    role="alert"
                  >
                    {errors.address.message}
                  </p>
                )}
              </div>

              {/* Document recto */}
              <div className="space-y-2">
                <Label htmlFor="documentFront">
                  Document recto <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="documentFront"
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  {...register('documentFront', {
                    onChange: e => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setValue('documentFront', file)
                      }
                    },
                  })}
                  aria-invalid={errors.documentFront ? 'true' : 'false'}
                  aria-describedby={
                    errors.documentFront ? 'documentFront-error' : undefined
                  }
                  disabled={isSubmitting}
                />
                {isUploading && uploadProgress.front > 0 && uploadProgress.front < 100 && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress.front} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      Upload en cours... {uploadProgress.front}%
                    </p>
                  </div>
                )}
                {uploadProgress.front === 100 && (
                  <div className="flex items-center gap-2 text-green-600">
                    <IconCircleCheck className="h-4 w-4" />
                    <p className="text-xs">Document téléchargé avec succès</p>
                  </div>
                )}
                {errors.documentFront && (
                  <p
                    id="documentFront-error"
                    className="text-sm text-destructive"
                    role="alert"
                  >
                    {errors.documentFront.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  JPEG, PNG ou PDF (maximum 5 MB)
                </p>
              </div>

              {/* Document verso (optionnel pour passeport) */}
              {documentType === 'national_id' && (
                <div className="space-y-2">
                  <Label htmlFor="documentBack">
                    Document verso (optionnel)
                  </Label>
                  <Input
                    id="documentBack"
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    {...register('documentBack', {
                      onChange: e => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setValue('documentBack', file)
                        }
                      },
                    })}
                    aria-invalid={errors.documentBack ? 'true' : 'false'}
                    aria-describedby={
                      errors.documentBack ? 'documentBack-error' : undefined
                    }
                    disabled={isSubmitting}
                  />
                  {isUploading && uploadProgress.back > 0 && uploadProgress.back < 100 && (
                    <div className="space-y-2">
                      <Progress value={uploadProgress.back} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        Upload en cours... {uploadProgress.back}%
                      </p>
                    </div>
                  )}
                  {uploadProgress.back === 100 && (
                    <div className="flex items-center gap-2 text-green-600">
                      <IconCircleCheck className="h-4 w-4" />
                      <p className="text-xs">Document téléchargé avec succès</p>
                    </div>
                  )}
                  {errors.documentBack && (
                    <p
                      id="documentBack-error"
                      className="text-sm text-destructive"
                      role="alert"
                    >
                      {errors.documentBack.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    JPEG, PNG ou PDF (maximum 5 MB)
                  </p>
                </div>
              )}

              {/* Bouton submit */}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <IconUpload className="mr-2 h-4 w-4" />
                    Soumettre ma demande KYC
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}




