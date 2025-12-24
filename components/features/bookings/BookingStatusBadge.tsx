/**
 * Badge de statut pour les réservations
 */

import { Badge } from '@/components/ui/badge'
import {
  IconClock,
  IconCircleCheck,
  IconTruck,
  IconPackageExport,
  IconCircleX
} from '@tabler/icons-react'

type BookingStatus = 'pending' | 'confirmed' | 'in_transit' | 'delivered' | 'cancelled'

interface BookingStatusBadgeProps {
  status: BookingStatus
  className?: string
}

export function BookingStatusBadge({ status, className }: BookingStatusBadgeProps) {
  const statusConfig = {
    pending: {
      label: 'En attente',
      variant: 'secondary' as const,
      icon: IconClock,
      className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
    },
    confirmed: {
      label: 'Confirmé',
      variant: 'default' as const,
      icon: IconCircleCheck,
      className: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
    },
    in_transit: {
      label: 'En transit',
      variant: 'default' as const,
      icon: IconTruck,
      className: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
    },
    delivered: {
      label: 'Livré',
      variant: 'default' as const,
      icon: IconPackageExport,
      className: 'bg-green-100 text-green-800 hover:bg-green-100',
    },
    cancelled: {
      label: 'Annulé',
      variant: 'destructive' as const,
      icon: IconCircleX,
      className: 'bg-red-100 text-red-800 hover:bg-red-100',
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className={`${config.className} ${className}`}>
      <Icon className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  )
}






