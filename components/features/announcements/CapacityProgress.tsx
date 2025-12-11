/**
 * Composant Progress Bar pour la capacité disponible
 */

import { Progress } from '@/components/ui/progress'
import { Package, Euro } from 'lucide-react'

interface CapacityProgressProps {
  maxWeight: number
  reservedWeight?: number
  pricePerKg: number
}

export function CapacityProgress({
  maxWeight,
  reservedWeight = 0,
  pricePerKg,
}: CapacityProgressProps) {
  const availableWeight = maxWeight - reservedWeight
  const percentageUsed = (reservedWeight / maxWeight) * 100
  const percentageAvailable = (availableWeight / maxWeight) * 100

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-muted-foreground" />
          <span className="font-semibold">Capacité disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <Euro className="h-5 w-5 text-muted-foreground" />
          <span className="font-semibold">{pricePerKg} €/kg</span>
        </div>
      </div>

      <div className="space-y-2">
        <Progress value={percentageUsed} className="h-3" />
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {reservedWeight} kg réservés
          </span>
          <span className="font-medium">
            {availableWeight} kg disponibles
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          Total : {maxWeight} kg
        </div>
      </div>

      {/* Calcul dynamique */}
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm font-medium mb-2">Calcul du prix :</p>
        <div className="space-y-1 text-sm">
          <p>
            <span className="font-semibold">{availableWeight} kg</span> ×{' '}
            <span className="font-semibold">{pricePerKg} €/kg</span> ={' '}
            <span className="font-bold text-primary">
              {availableWeight * pricePerKg} €
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}




