/**
 * Modal de suppression d'une réservation annulée
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
import { deleteCancelledBooking } from '@/lib/core/bookings/workflow'
import { IconLoader2, IconTrash } from '@tabler/icons-react'

interface DeleteBookingDialogProps {
  bookingId: string
  trigger?: React.ReactNode
  onDeleted?: () => void
  redirectAfterDelete?: boolean
}

export function DeleteBookingDialog({
  bookingId,
  trigger,
  onDeleted,
  redirectAfterDelete = true,
}: DeleteBookingDialogProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleDelete = async () => {
    setIsSubmitting(true)

    try {
      const result = await deleteCancelledBooking(bookingId)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success(result.message || 'Réservation supprimée')
      setIsOpen(false)

      // Appeler le callback si fourni
      if (onDeleted) {
        onDeleted()
      }

      // Rediriger seulement si demandé (par défaut oui, pour compatibilité)
      if (redirectAfterDelete) {
        router.push('/dashboard/colis')
        router.refresh()
      }
    } catch (error) {
      console.error('Error deleting booking:', error)
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
            <IconTrash className="mr-2 h-4 w-4" />
            Supprimer ce colis
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer ce colis ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. La réservation sera supprimée pour
            vous et pour l&apos;autre participant.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Retour</AlertDialogCancel>
          <AlertDialogAction
            onClick={e => {
              e.preventDefault()
              handleDelete()
            }}
            disabled={isSubmitting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isSubmitting ? (
              <>
                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                Suppression...
              </>
            ) : (
              'Confirmer la suppression'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
