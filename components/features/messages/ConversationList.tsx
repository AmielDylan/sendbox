/**
 * Composant liste des conversations (sidebar gauche)
 */

'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getUserConversations } from "@/lib/core/messages/actions"
import { generateInitials } from "@/lib/core/profile/utils"
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { IconLoader2 } from '@tabler/icons-react'
import { cn } from "@/lib/utils"

interface Conversation {
  booking_id: string
  other_user_id: string
  other_user_firstname: string | null
  other_user_lastname: string | null
  other_user_avatar_url: string | null
  last_message_content: string
  last_message_created_at: string
  unread_count: number
}

interface ConversationListProps {
  selectedBookingId: string | null
  onSelectConversation: (bookingId: string) => void
}

export function ConversationList({
  selectedBookingId,
  onSelectConversation,
}: ConversationListProps) {
  const {
    data: conversationsData,
    isLoading,
    refetch,
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

  // Refetch périodiquement pour mettre à jour les conversations
  useEffect(() => {
    const interval = setInterval(() => {
      refetch()
    }, 30000) // Toutes les 30 secondes

    return () => clearInterval(interval)
  }, [refetch])

  const conversations = (conversationsData || []) as Conversation[]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <IconLoader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Aucune conversation
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-1 p-2">
        {conversations.map((conversation) => {
          const otherUserName = `${conversation.other_user_firstname || ''} ${
            conversation.other_user_lastname || ''
          }`.trim() || 'Utilisateur'
          const otherUserInitials = generateInitials(
            conversation.other_user_firstname,
            conversation.other_user_lastname
          )
          const isSelected = selectedBookingId === conversation.booking_id
          const hasUnread = conversation.unread_count > 0

          return (
            <button
              key={conversation.booking_id}
              type="button"
              onClick={() => onSelectConversation(conversation.booking_id)}
              className={cn(
                'w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left',
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted',
                hasUnread && !isSelected && 'bg-muted/50'
              )}
            >
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage
                  src={conversation.other_user_avatar_url || undefined}
                  alt={otherUserName}
                />
                <AvatarFallback>{otherUserInitials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={cn(
                      'font-medium truncate',
                      isSelected && 'text-primary-foreground'
                    )}
                  >
                    {otherUserName}
                  </p>
                  {hasUnread && (
                    <Badge
                      variant={isSelected ? 'secondary' : 'default'}
                      className="ml-auto flex-shrink-0"
                    >
                      {conversation.unread_count}
                    </Badge>
                  )}
                </div>
                <p
                  className={cn(
                    'text-sm truncate mt-1',
                    isSelected
                      ? 'text-primary-foreground/80'
                      : 'text-muted-foreground',
                    hasUnread && !isSelected && 'font-medium'
                  )}
                >
                  {conversation.last_message_content}
                </p>
                <p
                  className={cn(
                    'text-xs mt-1',
                    isSelected
                      ? 'text-primary-foreground/60'
                      : 'text-muted-foreground'
                  )}
                >
                  {formatDistanceToNow(
                    new Date(conversation.last_message_created_at),
                    {
                      addSuffix: true,
                      locale: fr,
                    }
                  )}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </ScrollArea>
  )
}











