/**
 * Composant fenêtre de chat (zone principale)
 */

'use client'

import { useEffect, useRef, useState, useTransition, memo } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { useMessages, type Message } from '@/hooks/use-messages'
import { usePresence } from '@/hooks/use-presence'
import { sendMessage, markMessagesAsRead } from '@/lib/core/messages/actions'
import { generateInitials, getAvatarUrl } from '@/lib/core/profile/utils'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { IconSend, IconLoader2, IconArrowLeft } from '@tabler/icons-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/shared/db/client'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface ChatWindowProps {
  bookingId: string | null
  otherUserId: string | null
  otherUserName: string | null
  otherUserAvatar: string | null
  onBack?: () => void
  onMessagesRead?: () => void
}

interface MessageItemProps {
  message: Message
  currentUserId: string | null
}

/**
 * Composant optimisé pour le rendu d'un message individuel
 * Utilise React.memo pour éviter re-renders inutiles
 */
const MessageItem = memo(
  ({ message, currentUserId }: MessageItemProps) => {
    const isOwnMessage = message.sender_id === currentUserId

    return (
      <div
        className={cn('flex', isOwnMessage ? 'justify-end' : 'justify-start')}
      >
        <div
          className={cn(
            'flex flex-col max-w-[70%]',
            isOwnMessage ? 'items-end' : 'items-start'
          )}
        >
          <div
            className={cn(
              'rounded-lg px-4 py-2',
              isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-muted'
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
                    className="relative w-full max-w-[min(300px,calc(100vw-12rem))] sm:max-w-xs rounded-md overflow-hidden"
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
          <p className="text-xs text-muted-foreground mt-1">
            {format(new Date(message.created_at), 'HH:mm', { locale: fr })}
          </p>
        </div>
      </div>
    )
  },
  (prevProps, nextProps) => {
    // Comparer seulement les props qui affectent le rendu
    return (
      prevProps.message.id === nextProps.message.id &&
      prevProps.message.content === nextProps.message.content &&
      prevProps.message.is_read === nextProps.message.is_read &&
      prevProps.currentUserId === nextProps.currentUserId
    )
  }
)

MessageItem.displayName = 'MessageItem'

export function ChatWindow({
  bookingId,
  otherUserId,
  otherUserName,
  otherUserAvatar,
  onBack,
  onMessagesRead,
}: ChatWindowProps) {
  const { messages, isLoading, addOptimisticMessage, removeOptimisticMessage } =
    useMessages(bookingId)
  const [messageContent, setMessageContent] = useState('')
  const [isPending, startTransition] = useTransition()
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const otherAvatar = getAvatarUrl(
    otherUserAvatar,
    otherUserId || otherUserName
  )

  // Hook de présence pour le statut en ligne et typing indicators
  const { isUserOnline, isUserTyping, sendTypingStatus, stopTyping } =
    usePresence(bookingId ? `presence:${bookingId}` : '', currentUserId)

  // Marquer les messages comme lus quand la conversation est ouverte
  useEffect(() => {
    if (bookingId) {
      markMessagesAsRead(bookingId).then(() => {
        onMessagesRead?.()
      })
    }
  }, [bookingId, onMessagesRead])

  // Scroll automatique vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSendMessage = () => {
    if (
      !bookingId ||
      !otherUserId ||
      !messageContent.trim() ||
      !currentUserId
    ) {
      return
    }

    const content = messageContent.trim()
    const tempId = `temp-${crypto.randomUUID()}`

    setMessageContent('')

    // Arrêter le statut "typing" lors de l'envoi
    stopTyping()

    // Récupérer les infos sender depuis les messages existants OU créer un objet minimal
    const senderInfo = messages.find(m => m.sender_id === currentUserId)
      ?.sender || {
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
      content,
      sender_id: currentUserId,
      receiver_id: otherUserId,
      sender: senderInfo,
      receiver: receiverInfo,
    })

    startTransition(async () => {
      const result = await sendMessage({
        booking_id: bookingId,
        receiver_id: otherUserId,
        content,
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

  // Gérer l'indicateur "en train d'écrire"
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setMessageContent(newValue)

    // Envoyer le statut "typing" si l'utilisateur tape
    if (newValue.length > 0 && newValue.trim().length > 0) {
      sendTypingStatus()
    } else {
      stopTyping()
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
      <div className="border-b p-4 flex items-center justify-between bg-card">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="mr-1 md:hidden"
            >
              <IconArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <Avatar>
            <AvatarImage src={otherAvatar} alt={otherUserName || ''} />
            <AvatarFallback>
              {generateInitials(
                otherUserName?.split(' ')[0] || null,
                otherUserName?.split(' ')[1] || null
              )}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{otherUserName || 'Utilisateur'}</h3>
            <div className="flex items-center gap-2">
              {otherUserId && isUserTyping(otherUserId) ? (
                <span className="text-xs text-primary animate-pulse">
                  est en train d&apos;écrire...
                </span>
              ) : otherUserId && isUserOnline(otherUserId) ? (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs text-muted-foreground">
                    En ligne
                  </span>
                </div>
              ) : (
                <Link
                  href={`/dashboard/colis/${bookingId}`}
                  className="text-sm text-muted-foreground hover:underline"
                >
                  Voir la réservation
                </Link>
              )}
            </div>
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
            {messages.map(message => (
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
      <div className="border-t p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="flex gap-2">
          <Textarea
            value={messageContent}
            onChange={handleMessageChange}
            onKeyDown={handleKeyDown}
            placeholder="Tapez votre message..."
            rows={3}
            maxLength={2000}
            className="resize-none text-sm sm:text-base"
            aria-label="Message à envoyer"
            aria-describedby="message-counter"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!messageContent.trim() || isPending}
            size="icon"
            className="h-10 w-10 shrink-0"
            aria-label="Envoyer le message"
          >
            {isPending ? (
              <IconLoader2 className="h-4 w-4 animate-spin" />
            ) : (
              <IconSend className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <p>Shift + Entrée pour nouvelle ligne</p>
          <p id="message-counter" className="tabular-nums" aria-live="polite">
            {messageContent.length}/2000
          </p>
        </div>
      </div>
    </div>
  )
}
