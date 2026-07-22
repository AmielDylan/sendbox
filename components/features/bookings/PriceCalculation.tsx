/**
 * Composant pour afficher le calcul tarifaire
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { IconPackage } from '@tabler/icons-react'
import type { BookingCalculation } from '@/lib/core/bookings/calculations'
import { formatPrice } from '@/lib/core/bookings/calculations'

interface PriceCalculationProps {
  calculation: BookingCalculation
  weightKg: number
  packageValue: number
}

export function PriceCalculation({
  calculation,
  weightKg,
}: PriceCalculationProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Estimation du transport</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconPackage className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Montant indicatif</span>
          </div>
          <span className="font-medium">
            {formatPrice(calculation.transportPrice)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground ml-6">
          {weightKg.toFixed(1)} kg ×{' '}
          {weightKg > 0
            ? (calculation.transportPrice / weightKg).toFixed(2)
            : '0.00'}{' '}
          €/kg
        </p>

        <p className="rounded-lg bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">
          Le transport se règle directement entre vous et le voyageur. Sendbox
          facture séparément les frais de mise en relation après confirmation
          mutuelle.
        </p>
      </CardContent>
    </Card>
  )
}
