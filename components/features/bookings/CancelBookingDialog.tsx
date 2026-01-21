/**
 * Modal d'annulation de réservation
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { cancelBookingWithReason } from "@/lib/core/bookings/workflow"
import { IconLoader2, IconCircleX } from '@tabler/icons-react'

interface CancelBookingDialogProps {
  bookingId: string
  trigger?: React.ReactNode
  description?: string
  penaltyNotice?: string
  confirmLabel?: string
}

export function CancelBookingDialog({
  bookingId,
  trigger,
  description,
  penaltyNotice,
  confirmLabel,
}: CancelBookingDialogProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reason, setReason] = useState('')

  const handleCancel = async () => {
    if (!reason.trim() || reason.trim().length < 5) {
      toast.error('Veuillez fournir une raison (minimum 5 caractères)')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await cancelBookingWithReason(bookingId, reason.trim())

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Réservation annulée')
      setIsOpen(false)
      setReason('')
      router.refresh()
    } catch (error) {
      console.error('Error cancelling booking:', error)
      toast.error('Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) {
          setReason('')
        }
      }}
    >
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button variant="destructive" className="w-full">
            <IconCircleX className="mr-2 h-4 w-4" />
            Annuler la réservation
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Annuler cette réservation ?</AlertDialogTitle>
          <AlertDialogDescription>
            {description || 'Cette action est irréversible. La réservation sera annulée et l\'autre partie sera notifiée.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="cancel_reason">Raison de l'annulation</Label>
          <Textarea
            id="cancel_reason"
            placeholder="Expliquez brièvement la raison..."
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            disabled={isSubmitting}
          />
          {penaltyNotice && (
            <p className="text-xs text-destructive">{penaltyNotice}</p>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>
            Retour
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleCancel()
            }}
            disabled={isSubmitting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isSubmitting ? (
              <>
                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                Annulation...
              </>
            ) : (
              confirmLabel || 'Confirmer l\'annulation'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}






