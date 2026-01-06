/**
 * Page Messages avec chat temps réel
 */

'use client'

import { Suspense, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { getUserConversations } from "@/lib/core/messages/actions"
import { getUserNotifications, getUnreadNotificationsCount } from "@/lib/shared/db/queries/notifications"
import { PageHeader } from '@/components/ui/page-header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ConversationList } from '@/components/features/messages/ConversationList'
import { ChatWindow } from '@/components/features/messages/ChatWindow'
import { BookingRequestCard } from '@/components/features/bookings/BookingRequestCard'
import { getPendingBookingRequests } from "@/lib/core/bookings/requests"
import { Card, CardContent } from '@/components/ui/card'
import { IconLoader2, IconBell, IconInbox, IconMessageCircle } from '@tabler/icons-react'
import { createClient } from "@/lib/shared/db/client"
import { Separator } from '@/components/ui/separator'

function MessagesPageContent() {
  const searchParams = useSearchParams()
  const bookingIdFromUrl = searchParams.get('booking')

  const [unreadCount, setUnreadCount] = useState(0)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(bookingIdFromUrl)
  const [selectedConversation, setSelectedConversation] = useState<{
    bookingId: string
    otherUserId: string
    otherUserName: string
    otherUserAvatar: string | null
  } | null>(null)
  const [activeTab, setActiveTab] = useState(bookingIdFromUrl ? 'chat' : 'chat')

  // Query pour les conversations
  const {
    data: conversationsData,
    isLoading: isLoadingConversations,
    refetch: refetchConversations,
  } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const result = await getUserConversations()
      if (result.error) {
        throw new Error(result.error)
      }
      return result.conversations || []
    },
  })

  // Query pour les demandes en attente
  const {
    data: requestsData,
    isLoading: isLoadingRequests,
    refetch: refetchRequests,
  } = useQuery({
    queryKey: ['pending-booking-requests'],
    queryFn: async () => {
      const result = await getPendingBookingRequests()
      if (result.error) {
        throw new Error(result.error)
      }
      return result.bookings || []
    },
  })

  // Query pour les notifications
  const {
    data: notificationsData,
    isLoading: isLoadingNotifications,
    refetch: refetchNotifications,
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const result = await getUserNotifications(50)
      if (result.error) {
        return []
      }
      return result.data || []
    },
  })

  // Auto-sélectionner la conversation si booking_id dans l'URL
  useEffect(() => {
    const loadConversationFromBooking = async () => {
      if (!bookingIdFromUrl) return

      // D'abord essayer de trouver dans les conversations existantes
      if (conversationsData) {
        const conversation = conversationsData.find((c: any) => c.booking_id === bookingIdFromUrl)
        if (conversation) {
          handleSelectConversation(bookingIdFromUrl)
          return
        }
      }

      // Si pas trouvé, récupérer les détails de la réservation
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const { data: booking } = await supabase
        .from('bookings')
        .select('id, sender_id, traveler_id')
        .eq('id', bookingIdFromUrl)
        .single()

      if (booking) {
        // Déterminer l'autre utilisateur
        const isUserSender = booking.sender_id === user.id
        const otherUserId = isUserSender ? booking.traveler_id : booking.sender_id

        // Récupérer les infos de l'autre utilisateur
        const { data: otherUserProfile } = await supabase
          .from('profiles')
          .select('id, firstname, lastname, avatar_url')
          .eq('id', otherUserId)
          .single()

        if (otherUserProfile) {
          setSelectedBookingId(bookingIdFromUrl)
          setSelectedConversation({
            bookingId: bookingIdFromUrl,
            otherUserId: otherUserProfile.id,
            otherUserName: `${otherUserProfile.firstname || ''} ${otherUserProfile.lastname || ''}`.trim() || 'Utilisateur',
            otherUserAvatar: otherUserProfile.avatar_url,
          })
        }
      }
    }

    loadConversationFromBooking()
  }, [bookingIdFromUrl, conversationsData])

  // Récupérer le nombre de notifications non lues
  useEffect(() => {
    const loadUnreadCount = async () => {
      const result = await getUnreadNotificationsCount()
      setUnreadCount(result.count)
    }
    loadUnreadCount()

    // Écouter les nouvelles notifications en temps réel
    const supabase = createClient()
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          loadUnreadCount()
          refetchRequests()
          refetchConversations()
          refetchNotifications() // Rafraîchir aussi les notifications!
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [refetchRequests, refetchConversations, refetchNotifications])

  // Mettre à jour la conversation sélectionnée quand on clique sur une conversation
  const handleSelectConversation = async (bookingId: string) => {
    setSelectedBookingId(bookingId)

    // Récupérer les détails de la conversation
    const conversations = conversationsData || []
    const conversation = conversations.find((c: any) => c.booking_id === bookingId)

    if (conversation) {
      setSelectedConversation({
        bookingId,
        otherUserId: conversation.other_user_id,
        otherUserName: `${conversation.other_user_firstname || ''} ${
          conversation.other_user_lastname || ''
        }`.trim() || 'Utilisateur',
        otherUserAvatar: conversation.other_user_avatar_url,
      })
    }
  }

  const bookings = requestsData || []
  const notifications = notificationsData || []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        description="Gérez vos demandes de réservation et conversations"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Messages' },
        ]}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="chat">
            <IconMessageCircle className="mr-2 h-4 w-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="requests">
            <IconInbox className="mr-2 h-4 w-4" />
            Demandes
            {bookings.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {bookings.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <IconBell className="mr-2 h-4 w-4" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="default" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab Chat */}
        <TabsContent value="chat" className="space-y-0">
          <div className="border rounded-lg h-[calc(100vh-300px)] flex">
            {/* Sidebar gauche (30%) */}
            <div className="w-[30%] border-r flex flex-col">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Conversations</h3>
              </div>
              <div className="flex-1 overflow-hidden">
                {isLoadingConversations ? (
                  <div className="flex items-center justify-center h-full">
                    <IconLoader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <ConversationList
                    selectedBookingId={selectedBookingId}
                    onSelectConversation={handleSelectConversation}
                  />
                )}
              </div>
            </div>

            {/* Zone principale (70%) */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <ChatWindow
                  bookingId={selectedConversation.bookingId}
                  otherUserId={selectedConversation.otherUserId}
                  otherUserName={selectedConversation.otherUserName}
                  otherUserAvatar={selectedConversation.otherUserAvatar}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Sélectionnez une conversation pour commencer
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab Demandes */}
        <TabsContent value="requests" className="space-y-4">
          {isLoadingRequests ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : bookings.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Aucune demande en attente
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking: any) => (
                <BookingRequestCard
                  key={booking.id}
                  booking={booking}
                  onUpdate={refetchRequests}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab Notifications */}
        <TabsContent value="notifications" className="space-y-4">
          {isLoadingNotifications ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Aucune notification
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                    notification.read_at ? 'opacity-60' : ''
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{notification.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(notification.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      {!notification.read_at && (
                        <Badge variant="default" className="ml-4">
                          Nouveau
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <MessagesPageContent />
    </Suspense>
  )
}
