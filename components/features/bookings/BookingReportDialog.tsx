'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { IconAlertTriangle, IconLoader2 } from '@tabler/icons-react'
import { createBookingReport } from '@/lib/core/bookings/reports'
import { BOOKING_REPORT_REASONS } from '@/lib/core/bookings/report-policy'

interface BookingReportDialogProps {
  bookingId: string
  disabled?: boolean
  onSuccess?: () => void
}

export function BookingReportDialog({
  bookingId,
  disabled,
  onSuccess,
}: BookingReportDialogProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState('')
  const [suggestedNewDate, setSuggestedNewDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedReason = BOOKING_REPORT_REASONS.find(
    item => item.code === reason
  )
  const needsNewDate = reason === 'travel_postponed'

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const result = await createBookingReport({
        bookingId,
        reason,
        message,
        suggestedNewDate: needsNewDate ? suggestedNewDate : null,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success(result.message || 'Signalement envoyé')
      setOpen(false)
      setReason('')
      setMessage('')
      setSuggestedNewDate('')
      onSuccess?.()
    } catch (error) {
      console.error('Error creating booking report:', error)
      toast.error('Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full" disabled={disabled}>
          <IconAlertTriangle className="mr-2 h-4 w-4" />
          Signaler un problème
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Signaler un imprévu</DialogTitle>
          <DialogDescription>
            Ce signalement aide Sendbox à suivre la réservation. Il ne remplace
            pas un litige formel si la situation doit être arbitrée.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="booking-report-reason">Motif</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="booking-report-reason">
                <SelectValue placeholder="Choisir un motif..." />
              </SelectTrigger>
              <SelectContent>
                {BOOKING_REPORT_REASONS.map(item => (
                  <SelectItem key={item.code} value={item.code}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedReason ? (
              <p className="text-xs leading-5 text-muted-foreground">
                {selectedReason.description}
              </p>
            ) : null}
          </div>

          {needsNewDate ? (
            <div className="space-y-2">
              <Label htmlFor="booking-report-date">
                Nouvelle date proposée
              </Label>
              <Input
                id="booking-report-date"
                type="date"
                value={suggestedNewDate}
                onChange={event => setSuggestedNewDate(event.target.value)}
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="booking-report-message">
              Description{' '}
              <span className="font-normal text-muted-foreground">
                ({message.length}/700)
              </span>
            </Label>
            <Textarea
              id="booking-report-message"
              value={message}
              onChange={event => setMessage(event.target.value.slice(0, 700))}
              rows={5}
              placeholder="Décrivez les faits : date, échanges, impact, solution proposée si elle existe..."
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Annuler
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                Envoi...
              </>
            ) : (
              'Envoyer le signalement'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
