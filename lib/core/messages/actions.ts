/**
 * Server Actions pour le système de chat
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from "@/lib/shared/db/server"
import { z } from 'zod'

const sendMessageSchema = z.object({
  booking_id: z.string().uuid('ID de réservation invalide'),
  receiver_id: z.string().uuid('ID destinataire invalide'),
  content: z
    .string()
    .min(1, 'Le message ne peut pas être vide')
    .max(2000, 'Le message ne peut pas dépasser 2000 caractères'),
  attachments: z.array(z.string().url()).optional(),
})

export type SendMessageInput = z.infer<typeof sendMessageSchema>

// Rate limiting simple (à améliorer avec Redis en production)
const messageRateLimit = new Map<string, { count: number; resetAt: number }>()
const MAX_MESSAGES_PER_HOUR = 100

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userLimit = messageRateLimit.get(userId)

  if (!userLimit || now > userLimit.resetAt) {
    messageRateLimit.set(userId, { count: 1, resetAt: now + 60 * 60 * 1000 }) // 1 heure
    return true
  }

  if (userLimit.count >= MAX_MESSAGES_PER_HOUR) {
    return false
  }

  userLimit.count++
  return true
}

/**
 * Envoie un message dans une conversation
 */
export async function sendMessage(data: SendMessageInput) {
  const supabase = await createClient()

  // Vérifier l'authentification
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      error: 'Vous devez être connecté',
    }
  }

  // Validation Zod
  const validation = sendMessageSchema.safeParse(data)
  if (!validation.success) {
    return {
      error: validation.error.issues[0].message,
    }
  }

  const { booking_id, receiver_id, content, attachments } = validation.data

  // Rate limiting
  if (!checkRateLimit(user.id)) {
    return {
      error: 'Vous avez atteint la limite de messages. Veuillez réessayer plus tard.',
    }
  }

  // Vérifier que le booking existe et que l'utilisateur y a accès
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('sender_id, traveler_id')
    .eq('id', booking_id)
    .single()

  if (bookingError || !booking) {
    return {
      error: 'Réservation introuvable',
    }
  }

  // Vérifier que l'utilisateur est soit le sender soit le traveler
  if (booking.sender_id !== user.id && booking.traveler_id !== user.id) {
    return {
      error: 'Vous n\'êtes pas autorisé à envoyer un message pour cette réservation',
    }
  }

  // Vérifier que le receiver_id est valide (doit être l'autre partie)
  const otherUserId =
    booking.sender_id === user.id ? booking.traveler_id : booking.sender_id

  if (receiver_id !== otherUserId) {
    return {
      error: 'Destinataire invalide',
    }
  }

  // Nettoyer le contenu (protection XSS basique)
  const cleanContent = content
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim()

  if (cleanContent.length === 0) {
    return {
      error: 'Le message ne peut pas être vide',
    }
  }

  try {
    // Insérer le message
    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        booking_id,
        sender_id: user.id,
        receiver_id,
        content: cleanContent,
        attachments: attachments || [],
        is_read: false,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error sending message:', insertError)
      return {
        error: 'Erreur lors de l\'envoi du message',
      }
    }

    // Créer une notification si le destinataire est hors ligne
    // (On suppose qu'il est hors ligne si pas de read_at récent)
    await (supabase.rpc as any)('create_notification', {
      p_user_id: receiver_id,
      p_type: 'message',
      p_title: 'Nouveau message',
      p_content: `Vous avez reçu un nouveau message concernant une réservation`,
      p_booking_id: booking_id,
    })

    revalidatePath('/dashboard/messages')
    return {
      success: true,
      message: message,
    }
  } catch (error) {
    console.error('Error sending message:', error)
    return {
      error: 'Une erreur est survenue. Veuillez réessayer.',
    }
  }
}

/**
 * Marque les messages d'une conversation comme lus
 */
export async function markMessagesAsRead(bookingId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      error: 'Non authentifié',
    }
  }

  try {
    const { error } = await supabase
      .from('messages')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('booking_id', bookingId)
      .eq('receiver_id', user.id)
      .eq('is_read', false)

    if (error) {
      console.error('Error marking messages as read:', error)
      return {
        error: 'Erreur lors de la mise à jour',
      }
    }

    revalidatePath('/dashboard/messages')
    return {
      success: true,
    }
  } catch (error) {
    console.error('Error marking messages as read:', error)
    return {
      error: 'Une erreur est survenue',
    }
  }
}

/**
 * Récupère les conversations d'un utilisateur
 */
export async function getUserConversations() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      error: 'Non authentifié',
    }
  }

  try {
    const { data, error } = await (supabase.rpc as any)('get_user_conversations', {
      p_user_id: user.id,
    })

    if (error) {
      console.error('Error fetching conversations:', error)
      return {
        error: 'Erreur lors de la récupération des conversations',
      }
    }

    return {
      conversations: data || [],
    }
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return {
      error: 'Une erreur est survenue',
    }
  }
}

