/**
 * Hook personnalisé pour gérer les messages en temps réel avec Supabase Realtime
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Message {
  id: string
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
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
  }
  receiver?: {
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
  }
}

export function useMessages(bookingId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        const { data, error: fetchError } = await supabase
          .from('messages')
          .select(
            `
            *,
            sender:profiles!messages_sender_id_fkey (
              first_name,
              last_name,
              avatar_url
            ),
            receiver:profiles!messages_receiver_id_fkey (
              first_name,
              last_name,
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
          const { data: newMessage } = await supabase
            .from('messages')
            .select(
              `
              *,
              sender:profiles!messages_sender_id_fkey (
                first_name,
                last_name,
                avatar_url
              ),
              receiver:profiles!messages_receiver_id_fkey (
                first_name,
                last_name,
                avatar_url
              )
            `
            )
            .eq('id', payload.new.id)
            .single()

          if (newMessage) {
            setMessages((prev) => {
              // Éviter les doublons
              if (prev.some((m) => m.id === newMessage.id)) {
                return prev
              }
              return [...prev, newMessage as Message]
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

  return { messages, isLoading, error }
}

