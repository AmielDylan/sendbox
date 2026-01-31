'use client'

import { useState } from 'react'
import { IconMessageCircle } from '@tabler/icons-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'
import { FEATURES } from '@/lib/shared/config/features'

export function FeedbackDialog() {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<'bug' | 'feature' | 'other'>('other')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  if (!FEATURES.BETA_MODE) return null

  async function handleSubmit() {
    setLoading(true)

    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, message }),
      })

      toast.success('Merci pour votre feedback !')
      setOpen(false)
      setMessage('')
    } catch {
      toast.error('Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <IconMessageCircle className="mr-2 h-4 w-4" />
          Feedback
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Envoyer un feedback</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Type</Label>
            <RadioGroup value={type} onValueChange={(v: any) => setType(v)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bug" id="bug" />
                <Label htmlFor="bug">🐛 Bug</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="feature" id="feature" />
                <Label htmlFor="feature">💡 Suggestion</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other">💬 Autre</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label>Message</Label>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Décrivez votre feedback..."
              rows={5}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading || !message}
            className="w-full"
          >
            {loading ? 'Envoi...' : 'Envoyer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
