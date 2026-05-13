'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { IconPackage, IconArrowRight, IconFlag } from '@tabler/icons-react'

type TransactionStatus =
  | 'pending'
  | 'accepted'
  | 'matched'
  | 'confirmed'
  | 'handed'
  | 'in_transit'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'disputed'

interface TransactionCardProps {
  id: string
  status: TransactionStatus
  kilosRequested: number
  pricePerKg?: number | null
  departureCity: string
  departureCountry: string
  arrivalCity: string
  arrivalCountry: string
  departureDate: string
  counterpartName?: string | null
  counterpartRole: 'sender' | 'traveler'
  isFlagged?: boolean
  createdAt: string
}

const STATUS_LABELS: Record<TransactionStatus, string> = {
  pending: 'En attente',
  accepted: 'Acceptée',
  matched: 'Appariée',
  confirmed: 'Confirmée',
  handed: 'Remise effectuée',
  in_transit: 'En transit',
  delivered: 'Livrée',
  completed: 'Terminée',
  cancelled: 'Annulée',
  disputed: 'En litige',
}

const STATUS_VARIANT: Record<TransactionStatus, 'default' | 'secondary' | 'destructive' | 'outline' | 'warning'> = {
  pending: 'warning',
  accepted: 'secondary',
  matched: 'secondary',
  confirmed: 'secondary',
  handed: 'secondary',
  in_transit: 'secondary',
  delivered: 'default',
  completed: 'default',
  cancelled: 'outline',
  disputed: 'destructive',
}

export function TransactionCard({
  id,
  status,
  kilosRequested,
  pricePerKg,
  departureCity,
  departureCountry,
  arrivalCity,
  arrivalCountry,
  departureDate,
  counterpartName,
  counterpartRole,
  isFlagged,
  createdAt,
}: TransactionCardProps) {
  const totalPrice = pricePerKg ? kilosRequested * pricePerKg : null
  const formattedDate = format(new Date(departureDate), 'dd MMM yyyy', { locale: fr })
  const formattedCreatedAt = format(new Date(createdAt), 'dd MMM', { locale: fr })

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_VARIANT[status]}>
              {STATUS_LABELS[status]}
            </Badge>
            {isFlagged && (
              <Badge variant="destructive" className="gap-1">
                <IconFlag className="h-3 w-3" />
                Signalé
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{formattedCreatedAt}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">{departureCity}</span>
          <span className="text-muted-foreground text-xs">{departureCountry}</span>
          <IconArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium">{arrivalCity}</span>
          <span className="text-muted-foreground text-xs">{arrivalCountry}</span>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <IconPackage className="h-4 w-4" />
            <span>{kilosRequested} kg</span>
            {totalPrice != null && (
              <span className="ml-1 font-medium text-foreground">
                · {totalPrice.toFixed(2)} €
              </span>
            )}
          </div>
          <span>{formattedDate}</span>
        </div>

        {counterpartName && (
          <p className="text-xs text-muted-foreground">
            {counterpartRole === 'sender' ? 'Expéditeur' : 'Voyageur'} :{' '}
            <span className="font-medium text-foreground">{counterpartName}</span>
          </p>
        )}

        <Button asChild size="sm" variant="outline" className="w-full">
          <Link href={`/dashboard/colis/${id}`}>Voir les détails</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
