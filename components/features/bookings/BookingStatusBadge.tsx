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

type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'refused'
  | 'paid'
  | 'deposited'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'disputed'
  | 'confirmed'

interface BookingStatusBadgeProps {
  status: BookingStatus | string
  className?: string
}

export function BookingStatusBadge({ status, className }: BookingStatusBadgeProps) {
  const statusConfig: Record<string, {
    label: string
    variant: 'default' | 'secondary' | 'destructive'
    icon: any
    className: string
  }> = {
    pending: {
      label: 'En attente',
      variant: 'secondary',
      icon: IconClock,
      className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
    },
    accepted: {
      label: 'Accepté',
      variant: 'default',
      icon: IconCircleCheck,
      className: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
    },
    refused: {
      label: 'Refusé',
      variant: 'destructive',
      icon: IconCircleX,
      className: 'bg-red-100 text-red-800 hover:bg-red-100',
    },
    paid: {
      label: 'Payé',
      variant: 'default',
      icon: IconCircleCheck,
      className: 'bg-green-100 text-green-800 hover:bg-green-100',
    },
    deposited: {
      label: 'Déposé',
      variant: 'default',
      icon: IconPackageExport,
      className: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
    },
    confirmed: {
      label: 'Confirmé',
      variant: 'default',
      icon: IconCircleCheck,
      className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
    },
    in_transit: {
      label: 'En transit',
      variant: 'default',
      icon: IconTruck,
      className: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
    },
    delivered: {
      label: 'Livré',
      variant: 'default',
      icon: IconPackageExport,
      className: 'bg-green-100 text-green-800 hover:bg-green-100',
    },
    cancelled: {
      label: 'Annulé',
      variant: 'destructive',
      icon: IconCircleX,
      className: 'bg-red-100 text-red-800 hover:bg-red-100',
    },
    disputed: {
      label: 'En litige',
      variant: 'destructive',
      icon: IconCircleX,
      className: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
    },
  }

  const config = statusConfig[status] || {
    label: status,
    variant: 'secondary' as const,
    icon: IconClock,
    className: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
  }

  const Icon = config.icon

  return (
    <Badge variant={config.variant} className={`${config.className} ${className}`}>
      <Icon className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  )
}







