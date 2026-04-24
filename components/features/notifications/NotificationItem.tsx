/**
 * Composant Item de notification
 */

'use client'

import type { MouseEvent } from 'react'
import { Notification } from '@/lib/shared/db/queries/notifications'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { IconTrash } from '@tabler/icons-react'
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

export function NotificationItem({
  notification,
  onClick,
  onDelete,
}: NotificationItemProps) {
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
        'group flex gap-3 p-4 rounded-lg transition-colors cursor-pointer',
        isUnread ? 'bg-muted/50 hover:bg-muted' : 'hover:bg-muted/50'
      )}
      onClick={handleClick}
    >
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
      <div className="flex shrink-0 items-center gap-1.5 self-start">
        {isUnread && (
          <span className="inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold leading-none text-primary">
            new
          </span>
        )}
        <button
          type="button"
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          aria-label="Supprimer la notification"
        >
          <IconTrash className="h-3.5 w-3.5" />
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
