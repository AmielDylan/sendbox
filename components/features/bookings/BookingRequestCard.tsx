/**
 * Composant Card pour afficher une demande de réservation
 */

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  IconStar,
  IconPackage,
  IconCalendar,
  IconMapPin,
  IconCircleCheck,
  IconCircleX,
  IconMessageCircle,
  IconPhoto,
} from '@tabler/icons-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  generateInitials,
  getAvatarUrl,
  getShortDisplayName,
  getShortNameParts,
} from '@/lib/core/profile/utils'
import { formatPrice } from '@/lib/core/bookings/calculations'
import { acceptBooking, refuseBooking } from '@/lib/core/bookings/requests'
import {
  buildPackageRefusalReason,
  PACKAGE_REFUSAL_REASONS,
  type PackageRefusalReason,
} from '@/lib/core/bookings/package-safety'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

type BookingRequestStatus = 'pending' | 'accepted' | 'confirmed' | 'paid'

interface BookingRequest {
  id: string
  status: BookingRequestStatus
  kilos_requested?: number
  weight_kg?: number
  package_description?: string | null
  description?: string | null
  package_value: number | null
  package_photos: string[] | null
  created_at: string
  announcements: {
    departure_city: string
    arrival_city: string
    departure_country: string
    arrival_country: string
    departure_date: string
    price_per_kg: number
  }
  sender: {
    firstname: string | null
    lastname: string | null
    avatar_url: string | null
  } | null
}

interface BookingRequestCardProps {
  booking: BookingRequest
  onUpdate?: () => void
}

const STATUS_LABELS: Record<BookingRequestStatus, string> = {
  pending: 'En attente',
  accepted: 'Accepté',
  confirmed: 'Confirmé',
  paid: 'Confirmé',
}

const STATUS_VARIANTS: Record<
  BookingRequestStatus,
  'default' | 'secondary' | 'outline'
> = {
  pending: 'secondary',
  accepted: 'default',
  confirmed: 'default',
  paid: 'default',
}

export function BookingRequestCard({
  booking,
  onUpdate,
}: BookingRequestCardProps) {
  const router = useRouter()
  const [showAcceptModal, setShowAcceptModal] = useState(false)
  const [showRefuseModal, setShowRefuseModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [refusalReason, setRefusalReason] =
    useState<PackageRefusalReason | null>(null)
  const [refusalReasonOther, setRefusalReasonOther] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(
    null
  )

  const senderFirstName = booking.sender?.firstname ?? null
  const senderLastName = booking.sender?.lastname ?? null
  const senderName = getShortDisplayName(
    senderFirstName,
    senderLastName,
    'Expéditeur'
  )
  const senderParts = getShortNameParts(senderFirstName, senderLastName)
  const senderInitials = generateInitials(
    senderParts.firstName,
    senderParts.lastName
  )
  const senderAvatarUrl = booking.sender?.avatar_url ?? null
  const senderAvatar = getAvatarUrl(senderAvatarUrl, senderName)
  const isNew =
    new Date(booking.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  const announcement = booking.announcements

  // Support pour les deux colonnes: kilos_requested (nouveau) et weight_kg (ancien)
  const weightKg = booking.kilos_requested || 0
  const packageDescription =
    booking.package_description || booking.description || null
  const statusLabel = STATUS_LABELS[booking.status]
  const statusVariant = STATUS_VARIANTS[booking.status]

  const handleAccept = async () => {
    if (!acceptedTerms) {
      toast.error('Veuillez confirmer la revue de la declaration colis')
      return
    }

    setIsProcessing(true)
    try {
      const result = await acceptBooking(booking.id)

      if (result.error) {
        toast.error(result.error)
        if ((result as any).field === 'kyc') {
          router.push('/dashboard/reglages/kyc')
        }
        return
      }

      if (result.success) {
        toast.success(result.message || 'Demande acceptée', {
          description:
            "L'expéditeur est prévenu. La mise en relation sera finalisée après sa confirmation et le paiement des frais Sendbox.",
        })
        setShowAcceptModal(false)
        onUpdate?.()
      }
    } catch {
      toast.error("Impossible d'accepter la demande", {
        description:
          'Vérifiez votre connexion puis réessayez depuis cette carte.',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRefuse = async () => {
    if (!refusalReason) {
      toast.error('Veuillez selectionner une raison de refus')
      return
    }

    const reason = buildPackageRefusalReason({
      reason: refusalReason,
      details: refusalReason === 'other' ? refusalReasonOther : undefined,
    })

    if (!reason || reason.trim().length < 5) {
      toast.error('Veuillez fournir une raison de refus')
      return
    }

    setIsProcessing(true)
    try {
      const result = await refuseBooking(booking.id, reason)

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.success) {
        toast.success(result.message || 'Demande refusée', {
          description:
            "L'expéditeur est informé du motif. La demande ne pourra plus être acceptée.",
        })
        setShowRefuseModal(false)
        setRefusalReason(null)
        setRefusalReasonOther('')
        onUpdate?.()
      }
    } catch {
      toast.error('Impossible de refuser la demande', {
        description:
          'Vérifiez votre connexion puis réessayez depuis cette carte.',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const totalPrice = weightKg * announcement.price_per_kg

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={senderAvatar} alt={senderName} />
                <AvatarFallback>{senderInitials}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{senderName}</h3>
                <div className="flex items-center gap-1 mt-1">
                  <IconStar className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm">4.5</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isNew && (
                <Badge variant="default" className="bg-green-500">
                  Nouveau
                </Badge>
              )}
              <Badge variant={statusVariant}>{statusLabel}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Trajet */}
          <div className="flex items-center gap-2">
            <IconMapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {announcement.departure_city} → {announcement.arrival_city}
            </span>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2">
            <IconCalendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {format(new Date(announcement.departure_date), 'd MMM yyyy', {
                locale: fr,
              })}
            </span>
          </div>

          {/* Demande */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconPackage className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Demande</span>
              </div>
              <span className="font-semibold">
                {weightKg} kg pour {formatPrice(totalPrice)}
              </span>
            </div>
            {packageDescription && (
              <p className="whitespace-pre-line text-sm text-muted-foreground">
                {packageDescription}
              </p>
            )}
          </div>

          {/* Photos */}
          {booking.package_photos && booking.package_photos.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <IconPhoto className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Photos du colis</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {booking.package_photos.slice(0, 3).map((photo, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedPhotoIndex(index)}
                    className="relative aspect-square rounded-md overflow-hidden border hover:opacity-80 transition-opacity"
                  >
                    <Image
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
                {booking.package_photos.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setSelectedPhotoIndex(0)}
                    className="relative aspect-square rounded-md overflow-hidden border hover:opacity-80 transition-opacity flex items-center justify-center bg-muted"
                  >
                    <span className="text-sm font-medium">
                      +{booking.package_photos.length - 3}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          {booking.status === 'pending' ? (
            <div className="flex gap-2 pt-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowAcceptModal(true)}
                className="flex-1"
              >
                <IconCircleCheck className="mr-2 h-4 w-4" />
                Accepter
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowRefuseModal(true)}
                className="flex-1"
              >
                <IconCircleX className="mr-2 h-4 w-4" />
                Refuser
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/messages?booking=${booking.id}`}>
                  <IconMessageCircle className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2 pt-2">
              <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                {booking.status === 'accepted'
                  ? "Demande acceptée. L'expéditeur doit confirmer et régler les frais Sendbox pour finaliser la mise en relation."
                  : 'Mise en relation confirmée. Ouvrez la réservation pour préparer la prise en charge.'}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => router.push(`/dashboard/colis/${booking.id}`)}
                >
                  Voir la réservation
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/messages?booking=${booking.id}`}>
                    <IconMessageCircle className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Acceptation */}
      <Dialog
        open={showAcceptModal}
        onOpenChange={open => {
          setShowAcceptModal(open)
          if (!open) {
            setAcceptedTerms(false)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accepter cette demande</DialogTitle>
            <DialogDescription>
              Relisez la declaration colis avant de confirmer que vous pouvez
              transporter cette demande.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {packageDescription && (
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="mb-2 text-sm font-medium">Declaration colis</p>
                <p className="whitespace-pre-line text-sm text-muted-foreground">
                  {packageDescription}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <p className="text-sm font-medium">Rappels importants :</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>
                  Vous devez récupérer le colis à {announcement.departure_city}
                </li>
                <li>
                  Date de départ :{' '}
                  {format(new Date(announcement.departure_date), 'PP', {
                    locale: fr,
                  })}
                </li>
                <li>Poids à transporter : {weightKg} kg</li>
                <li>Prix de transport convenu : {formatPrice(totalPrice)}</li>
              </ul>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="accept_terms_booking"
                checked={acceptedTerms}
                onCheckedChange={checked => setAcceptedTerms(checked === true)}
              />
              <Label
                htmlFor="accept_terms_booking"
                className="cursor-pointer text-sm"
              >
                J'ai relu la declaration colis et je peux transporter ce colis
                selon les informations fournies.
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAcceptModal(false)
                setAcceptedTerms(false)
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleAccept}
              disabled={!acceptedTerms || isProcessing}
            >
              {isProcessing ? 'Traitement...' : 'Confirmer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Refus */}
      <Dialog
        open={showRefuseModal}
        onOpenChange={open => {
          setShowRefuseModal(open)
          if (!open) {
            setRefusalReason(null)
            setRefusalReasonOther('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser cette demande</DialogTitle>
            <DialogDescription>
              Indiquez pourquoi la declaration colis ne vous permet pas
              d'accepter cette demande.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {packageDescription && (
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="mb-2 text-sm font-medium">Declaration colis</p>
                <p className="whitespace-pre-line text-sm text-muted-foreground">
                  {packageDescription}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="refusal_reason">Raison du refus</Label>
              <Select
                value={refusalReason ?? ''}
                onValueChange={value =>
                  setRefusalReason(value as PackageRefusalReason)
                }
              >
                <SelectTrigger id="refusal_reason">
                  <SelectValue placeholder="Sélectionnez une raison" />
                </SelectTrigger>
                <SelectContent>
                  {PACKAGE_REFUSAL_REASONS.map(reason => (
                    <SelectItem key={reason.value} value={reason.value}>
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {refusalReason === 'other' && (
              <div className="space-y-2">
                <Label htmlFor="refusal_reason_other">Précisez la raison</Label>
                <Textarea
                  id="refusal_reason_other"
                  placeholder="Expliquez la raison du refus..."
                  value={refusalReasonOther}
                  onChange={e => setRefusalReasonOther(e.target.value)}
                  rows={3}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRefuseModal(false)
                setRefusalReason(null)
                setRefusalReasonOther('')
              }}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleRefuse}
              disabled={
                !refusalReason ||
                (refusalReason === 'other' && !refusalReasonOther.trim()) ||
                isProcessing
              }
            >
              {isProcessing ? 'Traitement...' : 'Confirmer le refus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Galerie Photos */}
      {selectedPhotoIndex !== null && booking.package_photos && (
        <Dialog
          open={selectedPhotoIndex !== null}
          onOpenChange={() => setSelectedPhotoIndex(null)}
        >
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Photos du colis</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {booking.package_photos.map((photo, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-md overflow-hidden border"
                >
                  <Image
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
