/**
 * Modal de confirmation de livraison (côté expéditeur)
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
import { confirmDeliveryReceipt } from '@/lib/core/bookings/workflow'
import { IconCircleCheck, IconLoader2 } from '@tabler/icons-react'

interface ConfirmDeliveryDialogProps {
  bookingId: string
  trigger?: React.ReactNode
}

export function ConfirmDeliveryDialog({ bookingId, trigger }: ConfirmDeliveryDialogProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConfirm = async () => {
    setIsSubmitting(true)

    try {
      const result = await confirmDeliveryReceipt(bookingId)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success(result.message || 'Livraison confirmée')
      setIsOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error confirming delivery:', error)
      toast.error('Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button className="w-full">
            <IconCircleCheck className="mr-2 h-4 w-4" />
            Confirmer la livraison
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmer la réception du colis ?</AlertDialogTitle>
          <AlertDialogDescription>
            En confirmant, vous validez la remise et le déblocage des fonds pour le voyageur.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Retour</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault()
              handleConfirm()
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirmation...
              </>
            ) : (
              'Confirmer'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
