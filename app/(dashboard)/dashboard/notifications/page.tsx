/**
 * Page Notifications complète
 */

'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { NotificationItem } from '@/components/features/notifications/NotificationItem'
import { markAllNotificationsAsRead, getNotifications } from "@/lib/core/notifications/actions"
import { IconLoader2, CheckCheck } from '@tabler/icons-react'
import { toast } from 'sonner'
import { useNotifications } from '@/hooks/use-notifications'

const NOTIFICATION_TYPES = [
  { value: 'all', label: 'Toutes' },
  { value: 'booking_request', label: 'Demandes de réservation' },
  { value: 'booking_accepted', label: 'Demandes acceptées' },
  { value: 'booking_refused', label: 'Demandes refusées' },
  { value: 'payment_confirmed', label: 'Paiements confirmés' },
  { value: 'deposit_reminder', label: 'Rappels dépôt' },
  { value: 'transit_started', label: 'En transit' },
  { value: 'delivery_reminder', label: 'Rappels livraison' },
  { value: 'rating_request', label: 'Demandes de notation' },
  { value: 'admin_message', label: 'Messages admin' },
  { value: 'system_alert', label: 'Alertes système' },
] as const

export default function NotificationsPage() {
  const [selectedType, setSelectedType] = useState<string>('all')
  const [page, setPage] = useState(1)
  const { unreadCount } = useNotifications()

  const {
    data: notificationsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['notifications', selectedType, page],
    queryFn: async () => {
      const result = await getNotifications(
        selectedType === 'all' ? undefined : (selectedType as any),
        page,
        20
      )
      if (result.error) {
        throw new Error(result.error)
      }
      return result
    },
  })

  const handleMarkAllAsRead = async () => {
    const result = await markAllNotificationsAsRead()
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Toutes les notifications ont été marquées comme lues')
      refetch()
    }
  }

  const notifications = notificationsData?.notifications || []
  const totalPages = notificationsData?.totalPages || 1

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Gérez toutes vos notifications"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Notifications' },
        ]}
        actions={
          unreadCount > 0 ? (
            <Button onClick={handleMarkAllAsRead} variant="outline">
              <CheckCheck className="mr-2 h-4 w-4" />
              Tout marquer comme lu
            </Button>
          ) : undefined
        }
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Mes notifications</CardTitle>
            <Select value={selectedType} onValueChange={(value) => {
              setSelectedType(value)
              setPage(1)
            }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NOTIFICATION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              Aucune notification
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {notifications.map((notification: any) => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Précédent
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} sur {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Suivant
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

