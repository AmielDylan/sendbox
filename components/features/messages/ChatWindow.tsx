/**
 * Composant fenêtre de chat (zone principale)
 */

'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { useMessages } from '@/hooks/use-messages'
import { sendMessage, markMessagesAsRead } from "@/lib/core/messages/actions"
import { generateInitials } from "@/lib/core/profile/utils"
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Send, Loader2, Image as ImageIcon } from 'lucide-react'
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

export function ChatWindow({
  bookingId,
  otherUserId,
  otherUserName,
  otherUserAvatar,
}: ChatWindowProps) {
  const router = useRouter()
  const { messages, isLoading } = useMessages(bookingId)
  const [messageContent, setMessageContent] = useState('')
  const [isPending, startTransition] = useTransition()
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
    if (!bookingId || !otherUserId || !messageContent.trim()) {
      return
    }

    const content = messageContent.trim()
    setMessageContent('')

    startTransition(async () => {
      const result = await sendMessage({
        booking_id: bookingId,
        receiver_id: otherUserId,
        content,
      })

      if (result.error) {
        toast.error(result.error)
        setMessageContent(content) // Restaurer le contenu en cas d'erreur
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

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
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Aucun message. Commencez la conversation !
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwnMessage = message.sender_id === currentUserId
              const senderName = isOwnMessage
                ? 'Vous'
                : `${message.sender?.first_name || ''} ${message.sender?.last_name || ''}`.trim() ||
                  'Utilisateur'

              return (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-3',
                    isOwnMessage ? 'flex-row-reverse' : 'flex-row'
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
                          message.sender?.first_name || null,
                          message.sender?.last_name || null
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
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(message.created_at), 'HH:mm', { locale: fr })}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
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
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
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


