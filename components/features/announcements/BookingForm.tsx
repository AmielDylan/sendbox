/**
 * Composant Formulaire de réservation
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Euro, Package } from 'lucide-react'

interface BookingFormProps {
  announcementId: string
  maxWeight: number
  pricePerKg: number
}

export function BookingForm({
  announcementId,
  maxWeight,
  pricePerKg,
}: BookingFormProps) {
  const router = useRouter()
  const [weight, setWeight] = useState(1)

  const totalPrice = weight * pricePerKg

  const handleContinue = () => {
    router.push(
      `/dashboard/bookings/new?announcement=${announcementId}&weight=${weight}`
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Réserver ce trajet</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="weight">
            Combien de kilos ? ({weight} kg)
          </Label>
          <Slider
            id="weight"
            min={1}
            max={maxWeight}
            step={0.5}
            value={[weight]}
            onValueChange={([value]) => setWeight(value)}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1 kg</span>
            <span>{maxWeight} kg max</span>
          </div>
        </div>

        <div className="p-4 bg-muted rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Poids</span>
            </div>
            <span className="font-semibold">{weight} kg</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Euro className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Prix total</span>
            </div>
            <span className="font-bold text-lg text-primary">
              {totalPrice.toFixed(2)} €
            </span>
          </div>
        </div>

        <Button onClick={handleContinue} className="w-full">
          Continuer
        </Button>
      </CardContent>
    </Card>
  )
}









