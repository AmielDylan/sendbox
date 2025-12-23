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
import { toast } from 'sonner'
import { cancelBooking } from '@/lib/actions/booking-workflow'
import { Loader2, XCircle } from 'lucide-react'

interface CancelBookingDialogProps {
  bookingId: string
  trigger?: React.ReactNode
}

export function CancelBookingDialog({ bookingId, trigger }: CancelBookingDialogProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCancel = async () => {
    setIsSubmitting(true)

    try {
      const result = await cancelBooking(bookingId)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Réservation annulée')
      setIsOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error cancelling booking:', error)
      toast.error('Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button variant="destructive" className="w-full">
            <XCircle className="mr-2 h-4 w-4" />
            Annuler la réservation
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Annuler cette réservation ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. La réservation sera annulée et le voyageur sera notifié.
          </AlertDialogDescription>
        </AlertDialogHeader>
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Annulation...
              </>
            ) : (
              'Confirmer l\'annulation'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}





