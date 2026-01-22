/**
 * Composant liste des conversations (sidebar gauche)
 */

'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { generateInitials, getAvatarUrl } from "@/lib/core/profile/utils"
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { IconLoader2 } from '@tabler/icons-react'
import { cn } from "@/lib/utils"

import { useAuth } from '@/hooks/use-auth'
import { usePresence } from '@/hooks/use-presence'

interface Conversation {
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

interface ConversationListProps {
  conversations: Conversation[]
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  selectedBookingId: string | null
  onSelectConversation: (bookingId: string) => void
}

export function ConversationList({
  conversations,
  isLoading,
  isError,
  onRetry,
  selectedBookingId,
  onSelectConversation,
}: ConversationListProps) {
  const { user } = useAuth()

  // Hook de présence global pour voir qui est en ligne dans toutes les conversations
  const { isUserOnline } = usePresence('conversations-presence', user?.id || null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <IconLoader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-sm text-muted-foreground">
        <p>Impossible de charger les conversations.</p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Réessayer
        </Button>
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
          const otherUserName = `${conversation.other_user_firstname || ''} ${conversation.other_user_lastname || ''
            }`.trim() || 'Utilisateur'
          const otherUserInitials = generateInitials(
            conversation.other_user_firstname,
            conversation.other_user_lastname
          )
          const otherUserAvatar = getAvatarUrl(
            conversation.other_user_avatar_url,
            conversation.other_user_id || otherUserName
          )
          const isSelected = selectedBookingId === conversation.booking_id

          // Logic: Show unread only if count > 0 AND (we don't know who sent it OR it wasn't us)
          // Ideally unread_count is 0 if we sent it, but to be safe per user request:
          const isLastMessageFromMe = user?.id === conversation.last_message_sender_id
          const hasUnread = conversation.unread_count > 0 && !isLastMessageFromMe && !isSelected

          return (
            <button
              key={conversation.booking_id}
              type="button"
              onClick={() => onSelectConversation(conversation.booking_id)}
              className={cn(
                'w-full flex items-start gap-3 p-4 rounded-xl transition-all text-left group',
                'active:scale-[0.98] touch-manipulation',
                isSelected
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'hover:bg-muted active:bg-muted/80',
                hasUnread && !isSelected && 'bg-muted/50 border-l-4 border-primary'
              )}
              aria-label={`Conversation avec ${otherUserName}, ${hasUnread ? `${conversation.unread_count} message(s) non lu(s)` : 'aucun nouveau message'}`}
              aria-current={isSelected ? 'true' : 'false'}
            >
              <div className="relative">
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 border-2 border-background">
                  <AvatarImage
                    src={otherUserAvatar}
                    alt={otherUserName}
                  />
                  <AvatarFallback>{otherUserInitials}</AvatarFallback>
                </Avatar>
                {/* Indicateur de présence en ligne */}
                {isUserOnline(conversation.other_user_id) && (
                  <div
                    className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"
                    aria-label="En ligne"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={cn(
                      'font-semibold truncate text-sm sm:text-base',
                      isSelected && 'text-primary-foreground'
                    )}
                  >
                    {otherUserName}
                  </p>
                  {hasUnread && (
                    <Badge
                      variant={isSelected ? 'secondary' : 'default'}
                      className="ml-auto flex-shrink-0 h-5 min-w-[1.25rem] px-1 flex items-center justify-center"
                    >
                      {conversation.unread_count}
                    </Badge>
                  )}
                </div>
                <p
                  className={cn(
                    'text-xs sm:text-sm truncate leading-snug',
                    isSelected
                      ? 'text-primary-foreground/90'
                      : 'text-muted-foreground',
                    hasUnread && !isSelected && 'font-medium text-foreground'
                  )}
                >
                  {isLastMessageFromMe && <span className="mr-1">Vous:</span>}
                  {conversation.last_message_content}
                </p>
                <p
                  className={cn(
                    'text-[10px] sm:text-xs',
                    isSelected
                      ? 'text-primary-foreground/70'
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







