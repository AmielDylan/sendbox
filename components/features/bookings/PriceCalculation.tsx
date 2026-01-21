/**
 * Composant pour afficher le calcul tarifaire
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { IconShield, IconPackage } from '@tabler/icons-react'
import type { BookingCalculation } from "@/lib/core/bookings/calculations"
import { formatPrice } from "@/lib/core/bookings/calculations"
import { MAX_INSURANCE_COVERAGE } from "@/lib/core/bookings/validations"

interface PriceCalculationProps {
  calculation: BookingCalculation
  weightKg: number
  packageValue: number
}

export function PriceCalculation({
  calculation,
  weightKg,
  packageValue,
}: PriceCalculationProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Résumé tarifaire</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Prix transport */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconPackage className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Transport</span>
          </div>
          <span className="font-medium">
            {formatPrice(calculation.transportPrice)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground ml-6">
          {weightKg.toFixed(1)} kg × {weightKg > 0 ? (calculation.transportPrice / weightKg).toFixed(2) : '0.00'} €/kg
        </p>

        {/* Commission */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Commission Sendbox (12%)
          </span>
          <span className="font-medium">{formatPrice(calculation.commission)}</span>
        </div>

        <Separator />

        {/* Sous-total */}
        <div className="flex items-center justify-between">
          <span className="font-medium">Sous-total</span>
          <span className="font-semibold">{formatPrice(calculation.subtotal)}</span>
        </div>

        {/* Protection du colis */}
        {calculation.insurancePremium !== null && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconShield className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Protection du colis</span>
                </div>
                <span className="font-medium">
                  {formatPrice(calculation.insurancePremium)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Plafond : {formatPrice(calculation.insuranceCoverage || 0)}
                {packageValue < MAX_INSURANCE_COVERAGE &&
                  ` (valeur déclarée : ${formatPrice(packageValue)})`}
              </p>
            </div>
          </>
        )}

        <Separator />

        {/* Total */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold">Total</span>
          <span className="text-xl font-bold text-primary">
            {formatPrice(calculation.total)}
          </span>
        </div>

        {calculation.insurancePremium !== null && (
          <p className="text-xs text-muted-foreground text-center">
            Dont {formatPrice(calculation.commission)} commission
            {calculation.insurancePremium !== null &&
              ` et ${formatPrice(calculation.insurancePremium)} protection`}
          </p>
        )}
      </CardContent>
    </Card>
  )
}






