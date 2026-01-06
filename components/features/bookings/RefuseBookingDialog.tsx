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
import { toast } from 'sonner'
import { refuseBooking } from "@/lib/core/bookings/requests"
import { IconLoader2, IconCircleX } from '@tabler/icons-react'

interface RefuseBookingDialogProps {
  bookingId: string
  trigger?: React.ReactNode
}

export function RefuseBookingDialog({ bookingId, trigger }: RefuseBookingDialogProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleRefuse = async () => {
    if (reason.trim().length < 5) {
      toast.error('Veuillez fournir une raison (minimum 5 caractères)')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await refuseBooking(bookingId, reason)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Réservation refusée')
      setIsOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error refusing booking:', error)
      toast.error('Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
            Veuillez indiquer la raison du refus. L'expéditeur sera notifié.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="reason">Raison du refus *</Label>
          <Textarea
            id="reason"
            placeholder="Ex: Capacité insuffisante, dates incompatibles, etc."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            disabled={isSubmitting}
          />
          <p className="text-sm text-muted-foreground">
            Minimum 5 caractères
          </p>
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
            disabled={isSubmitting}
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








