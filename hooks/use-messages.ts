/**
 * Hook personnalisé pour gérer les messages en temps réel avec Supabase Realtime
 */

import { useState, useEffect, useRef } from 'react'
import { createClient } from "@/lib/shared/db/client"
import type { RealtimeChannel } from '@supabase/supabase-js'

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

// Fonction de hash pour identifier un message par contenu + sender
function hashContent(content: string, senderId: string): string {
  return `${senderId}:${content.trim()}`
}

export function useMessages(bookingId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Map pour stocker temporairement le mapping hash → tempId des messages en attente
  const pendingMessagesMap = useRef<Map<string, {tempId: string, timestamp: number}>>(new Map())

  // Fonction pour ajouter un message optimiste (affichage immédiat)
  const addOptimisticMessage = (message: Partial<Message> & {
    content: string
    sender_id: string
    receiver_id: string
    tempId?: string
    sender?: { firstname: string | null; lastname: string | null; avatar_url: string | null }
    receiver?: { firstname: string | null; lastname: string | null; avatar_url: string | null }
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
      sender: message.sender,
      receiver: message.receiver,
    }

    // Stocker le mapping hash → tempId pour le matching Realtime
    if (message.tempId) {
      const contentHash = hashContent(message.content, message.sender_id)
      pendingMessagesMap.current.set(contentHash, {
        tempId: message.tempId,
        timestamp: Date.now()
      })

      // Auto-nettoyage après 30 secondes (au cas où le message Realtime ne revient jamais)
      setTimeout(() => {
        pendingMessagesMap.current.delete(contentHash)
      }, 30000)
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
        await supabase.auth.getSession()
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

    // Cleanup du channel précédent si existant
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

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
        (payload) => {
          const newMessageData = payload.new as any

          setMessages((prev) => {
            // Éviter doublons par ID réel
            if (prev.some((m) => m.id === newMessageData.id)) {
              return prev
            }

            // Calculer le hash du message reçu pour chercher le tempId correspondant
            const contentHash = hashContent(newMessageData.content, newMessageData.sender_id)
            const pendingMessage = pendingMessagesMap.current.get(contentHash)

            if (pendingMessage) {
              // On a trouvé le tempId correspondant dans notre Map!
              // C'est un message qu'on vient d'envoyer nous-mêmes
              const optimisticIndex = prev.findIndex(
                (m) => m.id.startsWith('optimistic-') && m.tempId === pendingMessage.tempId
              )

              if (optimisticIndex !== -1) {
                // Remplacer le message optimiste par le message réel
                // IMPORTANT: On garde les sender/receiver déjà chargés du message optimiste
                const optimisticMsg = prev[optimisticIndex]
                const realMessage: Message = {
                  ...newMessageData,
                  sender: optimisticMsg.sender,
                  receiver: optimisticMsg.receiver,
                } as Message

                const updatedMessages = [...prev]
                updatedMessages[optimisticIndex] = realMessage

                // Nettoyer le Map
                pendingMessagesMap.current.delete(contentHash)

                return updatedMessages
              }

              // Nettoyer le Map même si pas de match
              pendingMessagesMap.current.delete(contentHash)
            }

            // FALLBACK: Matcher par contenu + timestamp (pour messages sans tempId)
            const fallbackIndex = prev.findIndex(
              (m) =>
                m.id.startsWith('optimistic-') &&
                m.content === newMessageData.content &&
                m.sender_id === newMessageData.sender_id &&
                Math.abs(new Date(m.created_at).getTime() - new Date(newMessageData.created_at).getTime()) < 5000
            )

            if (fallbackIndex !== -1) {
              const optimisticMsg = prev[fallbackIndex]
              const realMessage: Message = {
                ...newMessageData,
                sender: optimisticMsg.sender,
                receiver: optimisticMsg.receiver,
              } as Message
              const updatedMessages = [...prev]
              updatedMessages[fallbackIndex] = realMessage
              return updatedMessages
            }

            // Nouveau message reçu d'un autre utilisateur
            // On doit fetch les infos sender/receiver de manière asynchrone
            // MAIS on ajoute d'abord le message sans ces infos pour affichage immédiat
            ;(async () => {
              const { data: fullMessage, error: fetchError } = await (supabase as any)
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
                .eq('id', newMessageData.id)
                .single()

              if (fetchError) {
                console.error('[Realtime] Error fetching message details:', fetchError)
              }

              if (fullMessage) {
                setMessages((current) =>
                  current.map((m) =>
                    m.id === newMessageData.id ? (fullMessage as unknown as Message) : m
                  )
                )
              }
            })()

            // Ajouter immédiatement le message (sans sender/receiver complet)
            setTimeout(() => {
              const messagesEnd = document.querySelector('[data-messages-end]')
              messagesEnd?.scrollIntoView({ behavior: 'smooth' })
            }, 100)
            return [...prev, newMessageData as Message]
          })
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

    // Stocker référence du channel
    channelRef.current = channel

    return () => {
      // Cleanup proper avec removeChannel (recommandé par Supabase)
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
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
