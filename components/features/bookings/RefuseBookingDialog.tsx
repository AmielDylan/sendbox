/**
 * Modal de refus de réservation
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { refuseBooking } from '@/lib/core/bookings/requests'
import {
  buildPackageRefusalReason,
  PACKAGE_REFUSAL_REASONS,
  type PackageRefusalReason,
} from '@/lib/core/bookings/package-safety'
import { IconLoader2, IconCircleX } from '@tabler/icons-react'

interface RefuseBookingDialogProps {
  bookingId: string
  trigger?: React.ReactNode
}

export function RefuseBookingDialog({
  bookingId,
  trigger,
}: RefuseBookingDialogProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState<PackageRefusalReason | null>(null)
  const [details, setDetails] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleRefuse = async () => {
    if (!reason) {
      toast.error('Veuillez selectionner une raison de refus')
      return
    }

    const refusalReason = buildPackageRefusalReason({
      reason,
      details: reason === 'other' ? details : undefined,
    })

    if (refusalReason.trim().length < 5) {
      toast.error('Veuillez fournir une raison (minimum 5 caracteres)')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await refuseBooking(bookingId, refusalReason)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Réservation refusée')
      setIsOpen(false)
      setReason(null)
      setDetails('')
      router.refresh()
    } catch (error) {
      console.error('Error refusing booking:', error)
      toast.error('Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => {
        setIsOpen(open)
        if (!open) {
          setReason(null)
          setDetails('')
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="destructive" className="w-full">
            <IconCircleX className="mr-2 h-4 w-4" />
            Refuser
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Refuser cette réservation</DialogTitle>
          <DialogDescription>
            Indiquez pourquoi la declaration colis ne vous permet pas d'accepter
            cette demande. L'expediteur sera notifie.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Raison du refus *</Label>
            <Select
              value={reason ?? ''}
              onValueChange={value => setReason(value as PackageRefusalReason)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="reason">
                <SelectValue placeholder="Selectionnez une raison" />
              </SelectTrigger>
              <SelectContent>
                {PACKAGE_REFUSAL_REASONS.map(reasonOption => (
                  <SelectItem
                    key={reasonOption.value}
                    value={reasonOption.value}
                  >
                    {reasonOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {reason === 'other' && (
            <div className="space-y-2">
              <Label htmlFor="reason_details">Precisez la raison</Label>
              <Textarea
                id="reason_details"
                placeholder="Expliquez la raison du refus..."
                value={details}
                onChange={e => setDetails(e.target.value)}
                rows={4}
                disabled={isSubmitting}
              />
              <p className="text-sm text-muted-foreground">
                Minimum 5 caracteres
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleRefuse}
            disabled={
              isSubmitting ||
              !reason ||
              (reason === 'other' && details.trim().length < 5)
            }
          >
            {isSubmitting ? (
              <>
                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                Refus en cours...
              </>
            ) : (
              'Confirmer le refus'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
