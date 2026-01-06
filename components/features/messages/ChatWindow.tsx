/**
 * Composant fenêtre de chat (zone principale)
 */

'use client'

import { useEffect, useRef, useState, useTransition, memo } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { useMessages, type Message } from '@/hooks/use-messages'
import { sendMessage, markMessagesAsRead } from "@/lib/core/messages/actions"
import { generateInitials } from "@/lib/core/profile/utils"
import { sanitizeMessageContent } from '@/lib/shared/security/xss-protection'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { IconSend, IconLoader2, IconPhoto } from '@tabler/icons-react'
import { toast } from 'sonner'
import { createClient } from "@/lib/shared/db/client"
import Image from 'next/image'
import Link from 'next/link'
import { cn } from "@/lib/utils"

interface ChatWindowProps {
  bookingId: string | null
  otherUserId: string | null
  otherUserName: string | null
  otherUserAvatar: string | null
}

interface MessageItemProps {
  message: Message
  currentUserId: string | null
}

/**
 * Composant optimisé pour le rendu d'un message individuel
 * Utilise React.memo pour éviter re-renders inutiles
 */
const MessageItem = memo(({ message, currentUserId }: MessageItemProps) => {
  const isOwnMessage = message.sender_id === currentUserId
  const isOptimistic = message.id.startsWith('optimistic-')
  const senderName = isOwnMessage
    ? 'Vous'
    : `${message.sender?.firstname || ''} ${message.sender?.lastname || ''}`.trim() ||
      'Utilisateur'

  return (
    <div
      className={cn(
        'flex gap-3',
        isOwnMessage ? 'flex-row-reverse' : 'flex-row',
        isOptimistic && 'opacity-70'
      )}
    >
      {!isOwnMessage && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage
            src={message.sender?.avatar_url || undefined}
            alt={senderName}
          />
          <AvatarFallback>
            {generateInitials(
              message.sender?.firstname || null,
              message.sender?.lastname || null
            )}
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'flex flex-col max-w-[70%]',
          isOwnMessage ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'rounded-lg px-4 py-2',
            isOwnMessage
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted'
          )}
        >
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((attachment, idx) => (
                <div
                  key={idx}
                  className="relative w-full max-w-xs rounded-md overflow-hidden"
                >
                  <Image
                    src={attachment}
                    alt={`Pièce jointe ${idx + 1}`}
                    width={300}
                    height={200}
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          {isOptimistic && (
            <IconLoader2 className="h-3 w-3 animate-spin" />
          )}
          {format(new Date(message.created_at), 'HH:mm', { locale: fr })}
        </p>
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  // Comparer seulement les props qui affectent le rendu
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.is_read === nextProps.message.is_read &&
    prevProps.currentUserId === nextProps.currentUserId
  )
})

MessageItem.displayName = 'MessageItem'

export function ChatWindow({
  bookingId,
  otherUserId,
  otherUserName,
  otherUserAvatar,
}: ChatWindowProps) {
  const router = useRouter()
  const { messages, isLoading, addOptimisticMessage, removeOptimisticMessage } = useMessages(bookingId)
  const [messageContent, setMessageContent] = useState('')
  const [isPending, startTransition] = useTransition()
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Marquer les messages comme lus quand la conversation est ouverte
  useEffect(() => {
    if (bookingId) {
      markMessagesAsRead(bookingId)
    }
  }, [bookingId])

  // Scroll automatique vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSendMessage = () => {
    if (!bookingId || !otherUserId || !messageContent.trim() || !currentUserId) {
      return
    }

    const content = messageContent.trim()
    const cleanContent = sanitizeMessageContent(content)
    const tempId = `temp-${crypto.randomUUID()}`

    setMessageContent('')

    // Récupérer les infos sender depuis les messages existants OU créer un objet minimal
    const senderInfo = messages.find(m => m.sender_id === currentUserId)?.sender || {
      firstname: null,
      lastname: null,
      avatar_url: null,
    }

    // Créer objet receiver minimal
    const receiverInfo = {
      firstname: otherUserName?.split(' ')[0] || null,
      lastname: otherUserName?.split(' ')[1] || null,
      avatar_url: otherUserAvatar,
    }

    // Ajouter immédiatement le message de manière optimiste avec infos complètes
    const optimisticId = addOptimisticMessage({
      tempId,
      content: cleanContent,
      sender_id: currentUserId,
      receiver_id: otherUserId,
      sender: senderInfo,
      receiver: receiverInfo,
    })

    startTransition(async () => {
      const result = await sendMessage({
        booking_id: bookingId,
        receiver_id: otherUserId,
        content: cleanContent,
        tempId,
      })

      if (result.error) {
        toast.error(result.error)
        setMessageContent(content) // Restaurer le contenu en cas d'erreur
        removeOptimisticMessage(optimisticId) // Supprimer le message optimiste
      }
      // Si succès, le message optimiste sera remplacé par le vrai message via Realtime
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  useEffect(() => {
    const getCurrentUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    getCurrentUser()
  }, [])

  if (!bookingId) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Sélectionnez une conversation pour commencer
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={otherUserAvatar || undefined} alt={otherUserName || ''} />
            <AvatarFallback>
              {generateInitials(
                otherUserName?.split(' ')[0] || null,
                otherUserName?.split(' ')[1] || null
              )}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{otherUserName || 'Utilisateur'}</h3>
            <Link
              href={`/dashboard/colis/${bookingId}`}
              className="text-sm text-muted-foreground hover:underline"
            >
              Voir la réservation
            </Link>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <IconLoader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Aucun message. Commencez la conversation !
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                currentUserId={currentUserId}
              />
            ))}
            <div ref={messagesEndRef} data-messages-end />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tapez votre message... (Entrée pour envoyer)"
            rows={3}
            maxLength={2000}
            className="resize-none"
          />
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleSendMessage}
              disabled={!messageContent.trim() || isPending}
              size="icon"
            >
              {isPending ? (
                <IconLoader2 className="h-4 w-4 animate-spin" />
              ) : (
                <IconSend className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-right">
          {messageContent.length}/2000
        </p>
      </div>
    </div>
  )
}


