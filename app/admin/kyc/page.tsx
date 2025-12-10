/**
 * Page admin pour review des KYC
 */

'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { kycReviewSchema, type KYCReviewInput } from '@/lib/validations/kyc'
import { getPendingKYC, reviewKYC, getKYCDocumentUrl } from '@/lib/actions/kyc'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, CheckCircle2, XCircle, Eye, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface PendingKYC {
  id: string
  user_id: string
  first_name: string | null
  last_name: string | null
  kyc_status: string
  kyc_submitted_at: string | null
  kyc_document_type: string | null
  kyc_document_front: string | null
  kyc_document_back: string | null
  kyc_rejection_reason: string | null
}

export default function AdminKYCPage() {
  const [kycList, setKycList] = useState<PendingKYC[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedKYC, setSelectedKYC] = useState<PendingKYC | null>(null)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [isReviewing, setIsReviewing] = useState(false)
  const [documentUrls, setDocumentUrls] = useState<{
    front: string | null
    back: string | null
  }>({ front: null, back: null })

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<KYCReviewInput>({
    resolver: zodResolver(kycReviewSchema),
  })

  useEffect(() => {
    loadPendingKYC()
  }, [])

  const loadPendingKYC = async () => {
    setIsLoading(true)
    try {
      const result = await getPendingKYC()
      if (result.error) {
        toast.error(result.error)
      } else {
        setKycList(result.kycList || [])
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des KYC')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReview = async (
    kyc: PendingKYC,
    action: 'approve' | 'reject'
  ) => {
    setSelectedKYC(kyc)
    setValue('profileId', kyc.id)
    setValue('action', action)
    if (action === 'reject') {
      setValue('rejectionReason', '')
    }
    setReviewDialogOpen(true)
  }

  const onSubmitReview = async (data: KYCReviewInput) => {
    if (!selectedKYC) return

    setIsReviewing(true)
    try {
      const result = await reviewKYC(data)

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.success) {
        toast.success(result.message)
        setReviewDialogOpen(false)
        reset()
        setSelectedKYC(null)
        await loadPendingKYC()
      }
    } catch (error) {
      toast.error('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsReviewing(false)
    }
  }

  const handleViewDocument = async (
    filePath: string | null,
    side: 'front' | 'back'
  ) => {
    if (!filePath) return

    try {
      const result = await getKYCDocumentUrl(filePath)
      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.url) {
        setDocumentUrls(prev => ({ ...prev, [side]: result.url! }))
        window.open(result.url, '_blank')
      }
    } catch (error) {
      toast.error("Erreur lors de l'ouverture du document")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Review KYC"
        description="Examinez et approuvez les demandes de vérification d'identité"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Admin', href: '/admin' },
          { label: 'KYC' },
        ]}
      />

      {/* Liste des KYC en attente */}
      <Card>
        <CardHeader>
          <CardTitle>Demandes en attente</CardTitle>
          <CardDescription>
            {kycList.length === 0
              ? 'Aucune demande KYC en attente'
              : `${kycList.length} demande(s) en attente de review`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {kycList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune demande KYC en attente</p>
            </div>
          ) : (
            <div className="space-y-4">
              {kycList.map(kyc => (
                <Card key={kyc.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">
                            {kyc.first_name} {kyc.last_name}
                          </h3>
                          <Badge variant="secondary">
                            <Clock className="mr-1 h-3 w-3" />
                            En attente
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>User ID: {kyc.user_id.slice(0, 8)}...</p>
                          <p>
                            Type de document:{' '}
                            {kyc.kyc_document_type === 'passport'
                              ? 'Passeport'
                              : 'Carte nationale'}
                          </p>
                          {kyc.kyc_submitted_at && (
                            <p>
                              Soumis le{' '}
                              {format(
                                new Date(kyc.kyc_submitted_at),
                                'PP à HH:mm',
                                { locale: fr }
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleViewDocument(
                              kyc.kyc_document_front || null,
                              'front'
                            )
                          }
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Voir recto
                        </Button>
                        {kyc.kyc_document_back && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleViewDocument(
                                kyc.kyc_document_back || null,
                                'back'
                              )
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Voir verso
                          </Button>
                        )}
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleReview(kyc, 'approve')}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Approuver
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleReview(kyc, 'reject')}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Rejeter
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de review */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedKYC &&
                (watch('action') === 'approve'
                  ? 'Approuver le KYC'
                  : 'Rejeter le KYC')}
            </DialogTitle>
            <DialogDescription>
              {selectedKYC &&
                (watch('action') === 'approve'
                  ? `Approuver la demande KYC de ${selectedKYC.first_name} ${selectedKYC.last_name} ?`
                  : `Rejeter la demande KYC de ${selectedKYC.first_name} ${selectedKYC.last_name} ?`)}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitReview)} className="space-y-4">
            {watch('action') === 'reject' && (
              <div className="space-y-2">
                <Label htmlFor="rejectionReason">Raison du rejet</Label>
                <Input
                  id="rejectionReason"
                  placeholder="Document illisible, informations manquantes..."
                  {...register('rejectionReason')}
                  aria-invalid={errors.rejectionReason ? 'true' : 'false'}
                />
                {errors.rejectionReason && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.rejectionReason.message}
                  </p>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setReviewDialogOpen(false)
                  reset()
                  setSelectedKYC(null)
                }}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isReviewing}
                variant={
                  watch('action') === 'approve' ? 'default' : 'destructive'
                }
              >
                {isReviewing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Traitement...
                  </>
                ) : watch('action') === 'approve' ? (
                  'Approuver'
                ) : (
                  'Rejeter'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
