/**
 * Hook personnalisé pour gérer les messages en temps réel avec Supabase Realtime
 */

import { useState, useEffect } from 'react'
import { createClient } from "@/lib/shared/db/client"

export interface Message {
  id: string
  tempId?: string  // ID temporaire pour matching optimiste
  booking_id: string
  sender_id: string
  receiver_id: string
  content: string
  attachments: string[] | null
  is_read: boolean
  read_at: string | null
  created_at: string
  updated_at: string
  sender?: {
    firstname: string | null
    lastname: string | null
    avatar_url: string | null
  }
  receiver?: {
    firstname: string | null
    lastname: string | null
    avatar_url: string | null
  }
}

export function useMessages(bookingId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fonction pour ajouter un message optimiste (affichage immédiat)
  const addOptimisticMessage = (message: Partial<Message> & {
    content: string
    sender_id: string
    receiver_id: string
    tempId?: string
  }) => {
    const optimisticMessage: Message = {
      id: `optimistic-${Date.now()}`,
      tempId: message.tempId,  // ID unique pour le matching
      booking_id: bookingId || '',
      sender_id: message.sender_id,
      receiver_id: message.receiver_id,
      content: message.content,  // Contenu déjà nettoyé côté ChatWindow
      attachments: null,
      is_read: false,
      read_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, optimisticMessage])

    // Auto-scroll
    setTimeout(() => {
      const messagesEnd = document.querySelector('[data-messages-end]')
      messagesEnd?.scrollIntoView({ behavior: 'smooth' })
    }, 100)

    return optimisticMessage.id
  }

  // Fonction pour remplacer un message optimiste par le message réel
  const replaceOptimisticMessage = (optimisticId: string, realMessage: Message) => {
    setMessages((prev) =>
      prev.map((msg) => msg.id === optimisticId ? realMessage : msg)
    )
  }

  // Fonction pour supprimer un message optimiste (en cas d'erreur)
  const removeOptimisticMessage = (optimisticId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId))
  }

  useEffect(() => {
    if (!bookingId) {
      setMessages([])
      setIsLoading(false)
      return
    }

    const supabase = createClient()

    // Charger les messages existants
    const loadMessages = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const { data, error: fetchError } = await (supabase as any)
          .from('messages')
          .select(
            `
            *,
            sender:profiles!messages_sender_id_fkey (
              firstname,
              lastname,
              avatar_url
            ),
            receiver:profiles!messages_receiver_id_fkey (
              firstname,
              lastname,
              avatar_url
            )
          `
          )
          .eq('booking_id', bookingId)
          .order('created_at', { ascending: true })

        if (fetchError) {
          console.error('Error loading messages:', fetchError)
          setError('Erreur lors du chargement des messages')
          return
        }

        setMessages((data as unknown as Message[]) || [])
      } catch (err) {
        console.error('Error loading messages:', err)
        setError('Une erreur est survenue')
      } finally {
        setIsLoading(false)
      }
    }

    loadMessages()

    // S'abonner aux nouveaux messages en temps réel
    const channel = supabase
      .channel(`messages:${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `booking_id=eq.${bookingId}`,
        },
        async (payload) => {
          // Récupérer les détails complets du nouveau message
          const { data: newMessage } = await (supabase as any)
            .from('messages')
            .select(
              `
              *,
              sender:profiles!messages_sender_id_fkey (
                firstname,
                lastname,
                avatar_url
              ),
              receiver:profiles!messages_receiver_id_fkey (
                firstname,
                lastname,
                avatar_url
              )
            `
            )
            .eq('id', payload.new.id)
            .single()

          if (newMessage) {
            setMessages((prev) => {
              // Éviter doublons par ID réel
              if (prev.some((m) => m.id === newMessage.id)) {
                return prev
              }

              // NOUVEAU: Matcher par tempId si disponible (prioritaire et plus fiable)
              if (newMessage.tempId) {
                const optimisticIndex = prev.findIndex(
                  (m) => m.id.startsWith('optimistic-') && m.tempId === newMessage.tempId
                )

                if (optimisticIndex !== -1) {
                  console.log('✅ Message optimiste remplacé par tempId:', newMessage.tempId)
                  const updatedMessages = [...prev]
                  updatedMessages[optimisticIndex] = newMessage as unknown as Message
                  return updatedMessages
                }
              }

              // FALLBACK: Matcher par contenu (pour compatibilité anciens messages)
              const optimisticIndex = prev.findIndex(
                (m) =>
                  m.id.startsWith('optimistic-') &&
                  m.content === newMessage.content &&
                  m.sender_id === newMessage.sender_id &&
                  Math.abs(new Date(m.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 5000
              )

              if (optimisticIndex !== -1) {
                console.log('✅ Message optimiste remplacé par contenu (fallback)')
                const updatedMessages = [...prev]
                updatedMessages[optimisticIndex] = newMessage as unknown as Message
                return updatedMessages
              }

              // Nouveau message (pas optimiste)
              console.log('📨 Nouveau message reçu (pas optimiste)')
              setTimeout(() => {
                const messagesEnd = document.querySelector('[data-messages-end]')
                messagesEnd?.scrollIntoView({ behavior: 'smooth' })
              }, 100)
              return [...prev, newMessage as unknown as Message]
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          // Mettre à jour le message si modifié (ex: marqué comme lu)
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === payload.new.id ? (payload.new as Message) : msg
            )
          )
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [bookingId])

  return {
    messages,
    isLoading,
    error,
    addOptimisticMessage,
    replaceOptimisticMessage,
    removeOptimisticMessage,
  }
}

