/**
 * Composant Item de notification
 */

'use client'

import type { MouseEvent } from 'react'
import { Notification } from '@/lib/shared/db/queries/notifications'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import {
  IconCircleCheck,
  IconCircleX,
  IconCreditCard,
  IconPackage,
  IconTruck,
  IconStar,
  IconMessageCircle,
  IconBell,
  IconShield,
  IconX,
} from '@tabler/icons-react'
import Link from 'next/link'
import {
  deleteNotification,
  markNotificationAsRead,
} from '@/lib/core/bookings/requests'

interface NotificationItemProps {
  notification: Notification
  onClick?: () => void
  onDelete?: (notificationId: string) => void
}

const NOTIFICATION_ICONS = {
  booking_request: IconPackage,
  booking_accepted: IconCircleCheck,
  booking_refused: IconCircleX,
  payment_confirmed: IconCreditCard,
  deposit_reminder: IconPackage,
  transit_started: IconTruck,
  delivery_reminder: IconPackage,
  delivery_confirmed: IconCircleCheck,
  rating_request: IconStar,
  admin_message: IconMessageCircle,
  system_alert: IconShield,
} as const

const NOTIFICATION_COLORS = {
  booking_request: 'text-blue-500',
  booking_accepted: 'text-green-500',
  booking_refused: 'text-red-500',
  payment_confirmed: 'text-green-500',
  deposit_reminder: 'text-yellow-500',
  transit_started: 'text-blue-500',
  delivery_reminder: 'text-yellow-500',
  delivery_confirmed: 'text-green-500',
  rating_request: 'text-yellow-500',
  admin_message: 'text-purple-500',
  system_alert: 'text-red-500',
} as const

export function NotificationItem({
  notification,
  onClick,
  onDelete,
}: NotificationItemProps) {
  const Icon =
    NOTIFICATION_ICONS[notification.type as keyof typeof NOTIFICATION_ICONS] ||
    IconBell
  const iconColor =
    NOTIFICATION_COLORS[
      notification.type as keyof typeof NOTIFICATION_COLORS
    ] || 'text-muted-foreground'

  const isUnread = !notification.read_at

  const handleClick = async () => {
    if (isUnread) {
      await markNotificationAsRead(notification.id)
    }
    onClick?.()
  }

  const handleDelete = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    const result = await deleteNotification(notification.id)
    if (!result?.error) {
      onDelete?.(notification.id)
    }
  }

  const getLink = () => {
    if (notification.type === 'admin_message' && notification.booking_id) {
      return `/dashboard/messages?booking=${notification.booking_id}`
    }
    if (notification.booking_id) {
      return `/dashboard/colis/${notification.booking_id}`
    }
    if (notification.announcement_id) {
      return `/annonces/${notification.announcement_id}`
    }
    return null
  }

  const link = getLink()
  const content = (
    <div
      className={cn(
        'flex gap-3 p-3 rounded-lg transition-colors cursor-pointer',
        isUnread ? 'bg-muted/50 hover:bg-muted' : 'hover:bg-muted/50'
      )}
      onClick={handleClick}
    >
      <div className={cn('flex-shrink-0 mt-0.5', iconColor)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', isUnread && 'font-semibold')}>
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {notification.content}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.created_at), {
            addSuffix: true,
            locale: fr,
          })}
        </p>
      </div>
      <div className="flex flex-col items-end gap-2">
        {isUnread && (
          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-1" />
        )}
        <button
          type="button"
          onClick={handleDelete}
          className="text-muted-foreground hover:text-destructive transition-colors"
          aria-label="Supprimer la notification"
        >
          <IconX className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )

  if (link) {
    return (
      <Link href={link} className="block">
        {content}
      </Link>
    )
  }

  return content
}
