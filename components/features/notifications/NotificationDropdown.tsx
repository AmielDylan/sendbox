/**
 * Composant Dropdown Notifications pour le header
 */

'use client'

import { useState } from 'react'
import { IconBell, IconLoader2 } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useNotifications } from '@/hooks/use-notifications'
import Link from 'next/link'
import { NotificationItem } from './NotificationItem'

export function NotificationDropdown() {
  const [open, setOpen] = useState(false)
  const { notifications, unreadCount, isLoading, removeNotification } =
    useNotifications(5)

  const recentNotifications = notifications.slice(0, 5)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-9 gap-2 rounded-full bg-muted px-3 hover:bg-muted/80">
          <IconBell className="h-4 w-4 shrink-0" />
          <span className="hidden text-sm font-medium sm:inline">Mes alertes</span>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-background" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <Badge variant="secondary">{unreadCount} non lues</Badge>
          )}
        </DropdownMenuLabel>
        <Separator />
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <IconLoader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : recentNotifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Aucune notification
            </div>
          ) : (
            <div className="py-2">
              {recentNotifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={() => setOpen(false)}
                  onDelete={id => removeNotification(id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
        <Separator />
        <div className="p-2">
          <Button variant="outline" className="w-full" asChild>
            <Link
              href="/dashboard/messages?tab=notifications"
              onClick={() => setOpen(false)}
            >
              Voir tout
            </Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
