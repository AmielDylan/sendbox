/**
 * Page Messages avec chat temps réel
 */

'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { getUserConversations } from '@/lib/core/messages/actions'
import {
  getUserNotifications,
  getUnreadNotificationsCount,
} from '@/lib/shared/db/queries/notifications'
import { PageHeader } from '@/components/ui/page-header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ConversationList } from '@/components/features/messages/ConversationList'
import { ChatWindow } from '@/components/features/messages/ChatWindow'
import { ConnectionIndicator } from '@/components/features/messages/ConnectionIndicator'
import { BookingRequestCard } from '@/components/features/bookings/BookingRequestCard'
import { getPendingBookingRequests } from '@/lib/core/bookings/requests'
import { getPublicProfiles } from '@/lib/shared/db/queries/public-profiles'
import { Card, CardContent } from '@/components/ui/card'
import {
  IconLoader2,
  IconBell,
  IconInbox,
  IconMessageCircle,
} from '@tabler/icons-react'
import { createClient } from '@/lib/shared/db/client'
import { NotificationItem } from '@/components/features/notifications/NotificationItem'

type ConversationSummary = {
  booking_id: string
  other_user_id: string
  other_user_firstname: string | null
  other_user_lastname: string | null
  other_user_avatar_url: string | null
  last_message_content: string
  last_message_created_at: string
  last_message_sender_id: string
  unread_count: number
}

function MessagesPageContent() {
  const searchParams = useSearchParams()
  const bookingIdFromUrl = searchParams.get('booking')
  const tabFromUrl = searchParams.get('tab')
  const resolvedTab =
    tabFromUrl === 'notifications' ||
    tabFromUrl === 'requests' ||
    tabFromUrl === 'chat'
      ? tabFromUrl
      : null

  const [unreadCount, setUnreadCount] = useState(0)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    bookingIdFromUrl
  )
  const [selectedConversation, setSelectedConversation] = useState<{
    bookingId: string
    otherUserId: string
    otherUserName: string
    otherUserAvatar: string | null
  } | null>(null)
  const [pendingConversation, setPendingConversation] =
    useState<ConversationSummary | null>(null)
  const [activeTab, setActiveTab] = useState(resolvedTab || 'chat')

  useEffect(() => {
    if (bookingIdFromUrl) {
      setActiveTab('chat')
      return
    }

    if (resolvedTab) {
      setActiveTab(resolvedTab)
    }
  }, [bookingIdFromUrl, resolvedTab])

  // Query pour les conversations
  const {
    data: conversationsData,
    isLoading: isLoadingConversations,
    isError: isErrorConversations,
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
    retry: 1,
  })

  useEffect(() => {
    const interval = setInterval(() => {
      refetchConversations()
    }, 30000)

    return () => clearInterval(interval)
  }, [refetchConversations])

  // Query pour les demandes actives
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

  // Mettre à jour la conversation sélectionnée quand on clique sur une conversation
  const handleSelectConversation = useCallback(
    async (bookingId: string) => {
      setSelectedBookingId(bookingId)

      // Récupérer les détails de la conversation
      const baseConversations = conversationsData || []
      const conversationList =
        pendingConversation &&
        !baseConversations.some(
          (c: any) => c.booking_id === pendingConversation.booking_id
        )
          ? [pendingConversation, ...baseConversations]
          : baseConversations
      const conversation = conversationList.find(
        (c: any) => c.booking_id === bookingId
      )

      if (conversation) {
        setSelectedConversation({
          bookingId,
          otherUserId: conversation.other_user_id,
          otherUserName:
            `${conversation.other_user_firstname || ''} ${
              conversation.other_user_lastname || ''
            }`.trim() || 'Utilisateur',
          otherUserAvatar: conversation.other_user_avatar_url,
        })
      }
    },
    [conversationsData, pendingConversation]
  )

  // Auto-sélectionner la conversation si booking_id dans l'URL
  useEffect(() => {
    const loadConversationFromBooking = async () => {
      if (!bookingIdFromUrl) return

      // D'abord essayer de trouver dans les conversations existantes
      if (conversationsData) {
        const conversation = conversationsData.find(
          (c: any) => c.booking_id === bookingIdFromUrl
        )
        if (conversation) {
          handleSelectConversation(bookingIdFromUrl)
          return
        }
      }

      // Si pas trouvé, récupérer les détails de la réservation
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data: booking } = await supabase
        .from('bookings')
        .select('id, sender_id, traveler_id, created_at')
        .eq('id', bookingIdFromUrl)
        .single()

      if (booking) {
        // Déterminer l'autre utilisateur
        const isUserSender = booking.sender_id === user.id
        const otherUserId = isUserSender
          ? booking.traveler_id
          : booking.sender_id

        // Récupérer les infos de l'autre utilisateur
        const { data: publicProfiles } = await getPublicProfiles(supabase, [
          otherUserId,
        ])
        const otherUserProfile = publicProfiles?.[0] || null
        const otherUserName = otherUserProfile
          ? `${otherUserProfile.firstname || ''} ${otherUserProfile.lastname || ''}`.trim() ||
            'Utilisateur'
          : 'Utilisateur'

        setSelectedBookingId(bookingIdFromUrl)
        setSelectedConversation({
          bookingId: bookingIdFromUrl,
          otherUserId,
          otherUserName,
          otherUserAvatar: otherUserProfile?.avatar_url || null,
        })
        setPendingConversation({
          booking_id: bookingIdFromUrl,
          other_user_id: otherUserId,
          other_user_firstname: otherUserProfile?.firstname || null,
          other_user_lastname: otherUserProfile?.lastname || null,
          other_user_avatar_url: otherUserProfile?.avatar_url || null,
          last_message_content: 'Nouvelle conversation',
          last_message_created_at:
            booking.created_at || new Date().toISOString(),
          last_message_sender_id: '',
          unread_count: 0,
        })
      }
    }

    loadConversationFromBooking()
  }, [bookingIdFromUrl, conversationsData, handleSelectConversation])

  useEffect(() => {
    if (
      pendingConversation &&
      conversationsData?.some(
        (c: any) => c.booking_id === pendingConversation.booking_id
      )
    ) {
      setPendingConversation(null)
    }
  }, [conversationsData, pendingConversation])

  // Récupérer le nombre de notifications non lues
  useEffect(() => {
    let isActive = true

    const loadUnreadCount = async () => {
      const result = await getUnreadNotificationsCount()
      if (isActive) {
        setUnreadCount(result.count)
      }
    }
    loadUnreadCount()

    // Écouter les nouvelles notifications en temps réel
    const supabase = createClient()
    const getChannelName = (userId: string) => {
      const suffix =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2)
      return `notifications:messages:${userId}:${suffix}`
    }

    // Obtenir l'userId pour filtrer correctement
    const setupRealtimeSubscription = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user || !isActive) return

      const channel = supabase
        .channel(getChannelName(user.id))
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            loadUnreadCount()
            refetchRequests()
            refetchConversations()
            refetchNotifications() // Rafraîchir aussi les notifications!
          }
        )
        .subscribe()

      return channel
    }

    const channelPromise = setupRealtimeSubscription()

    return () => {
      isActive = false
      channelPromise.then(channel => {
        if (channel) {
          supabase.removeChannel(channel)
        }
      })
    }
  }, [refetchRequests, refetchConversations, refetchNotifications])

  // Rafraîchir les demandes en temps réel (bookings)
  useEffect(() => {
    const supabase = createClient()
    let isActive = true
    let channel: any = null

    const getChannelName = (userId: string) => {
      const suffix =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2)
      return `bookings:messages:${userId}:${suffix}`
    }

    const setupRealtimeSubscription = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user || !isActive) return

      channel = supabase
        .channel(getChannelName(user.id))
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookings',
            filter: `sender_id=eq.${user.id}`,
          },
          () => {
            refetchRequests()
            refetchConversations()
            refetchNotifications()
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookings',
            filter: `traveler_id=eq.${user.id}`,
          },
          () => {
            refetchRequests()
            refetchConversations()
            refetchNotifications()
          }
        )
        .subscribe()
    }

    setupRealtimeSubscription()

    return () => {
      isActive = false
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [refetchRequests, refetchConversations, refetchNotifications])

  // Rafraîchir les conversations en temps réel (messages reçus/envoyés)
  useEffect(() => {
    const supabase = createClient()
    let isActive = true
    let channel: any = null

    const getChannelName = (userId: string) => {
      const suffix =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2)
      return `messages:inbox:${userId}:${suffix}`
    }

    const setupRealtimeSubscription = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user || !isActive) return

      channel = supabase
        .channel(getChannelName(user.id))
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `sender_id=eq.${user.id}`,
          },
          () => {
            refetchConversations()
            refetchNotifications()
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${user.id}`,
          },
          () => {
            refetchConversations()
            refetchNotifications()
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `sender_id=eq.${user.id}`,
          },
          () => {
            refetchConversations()
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${user.id}`,
          },
          () => {
            refetchConversations()
          }
        )
        .subscribe()
    }

    setupRealtimeSubscription()

    return () => {
      isActive = false
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [refetchConversations, refetchNotifications])

  const bookings = requestsData || []
  const notifications = notificationsData || []
  const conversations = conversationsData || []
  const mergedConversations =
    pendingConversation &&
    !conversations.some(
      (c: any) => c.booking_id === pendingConversation.booking_id
    )
      ? [pendingConversation, ...conversations]
      : conversations

  return (
    <div className="space-y-8">
      <PageHeader
        title="Messages"
        description="Gérez vos demandes de réservation et conversations"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Messages' },
        ]}
      />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="chat" className="gap-2">
            <IconMessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Chat</span>
          </TabsTrigger>
          <TabsTrigger
            value="requests"
            className="gap-1 sm:gap-2 flex items-center justify-center"
          >
            <IconInbox className="h-4 w-4" />
            <span className="hidden sm:inline">Demandes</span>
            {bookings.length > 0 && (
              <Badge
                variant="secondary"
                className="h-5 min-w-5 px-1.5 text-xs sm:ml-2"
              >
                {bookings.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <IconBell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
            {unreadCount > 0 && (
              <Badge className="ml-1 sm:ml-2 h-5 min-w-5 px-1.5 text-xs bg-primary">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <div
            className="w-full border flex flex-col overflow-hidden bg-background"
            style={{ height: 'calc(100dvh - 280px)', minHeight: '500px' }}
          >
            {/* Indicateur de connexion */}
            <div className="border-b px-4 py-2">
              <ConnectionIndicator />
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar: Liste conversations */}
              <div
                className={`
                ${selectedConversation ? 'hidden md:flex' : 'flex'}
                w-full md:w-80 lg:w-96 border-r flex-col
              `}
              >
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-lg">Conversations</h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <ConversationList
                    conversations={mergedConversations}
                    isLoading={isLoadingConversations}
                    isError={isErrorConversations}
                    onRetry={refetchConversations}
                    selectedBookingId={selectedBookingId}
                    onSelectConversation={handleSelectConversation}
                  />
                </div>
              </div>

              {/* Zone principale: Chat */}
              <div
                className={`
                ${selectedConversation ? 'flex' : 'hidden md:flex'}
                flex-1 flex-col
              `}
              >
                {selectedConversation ? (
                  <ChatWindow
                    bookingId={selectedConversation.bookingId}
                    otherUserId={selectedConversation.otherUserId}
                    otherUserName={selectedConversation.otherUserName}
                    otherUserAvatar={selectedConversation.otherUserAvatar}
                    onMessagesRead={refetchConversations}
                    onBack={() => {
                      setSelectedConversation(null)
                      setSelectedBookingId(null)
                    }}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <div className="text-center p-6">
                      <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4 mx-auto">
                        <IconMessageCircle className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                      <h3 className="font-semibold text-lg mb-1">
                        Vos messages
                      </h3>
                      <p className="max-w-xs text-sm">
                        Sélectionnez une conversation pour commencer
                      </p>
                    </div>
                  </div>
                )}
              </div>
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
                  Aucune demande active
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking: any) => (
                <BookingRequestCard
                  key={booking.id}
                  booking={booking}
                  onUpdate={() => {
                    refetchRequests()
                    refetchConversations()
                    refetchNotifications()
                  }}
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
              {notifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onDelete={async () => {
                    refetchNotifications()
                    const result = await getUnreadNotificationsCount()
                    setUnreadCount(result.count)
                  }}
                />
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
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <MessagesPageContent />
    </Suspense>
  )
}
