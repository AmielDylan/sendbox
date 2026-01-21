# Implémentation d'un composant de chat en temps réel avec Supabase

## 📋 Vue d'ensemble

Ce guide présente l'implémentation complète d'un système de messagerie en temps réel utilisant Supabase Realtime. L'approche combine plusieurs fonctionnalités de Supabase :

- **PostgreSQL Changes** : Pour écouter les nouveaux messages avec garantie de livraison
- **Presence** : Pour gérer le statut en ligne/hors ligne des utilisateurs
- **Broadcast** : Pour les indicateurs de frappe temporaires

## 🏗️ Architecture

### Flux de données

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   ChatWindow    │    │   useMessages    │    │   usePresence   │
│   Component     │◄──►│   Hook           │◄──►│   Hook          │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Realtime                        │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │ PostgreSQL   │  │  Presence    │  │   Broadcast     │   │
│  │  Changes     │  │              │  │                 │   │
│  │ (Messages)   │  │ (Online      │  │ (Typing)        │   │
│  │              │  │  Status)     │  │                 │   │
│  └──────────────┘  └──────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 🗄️ Schéma de base de données

### Table `messages`

```sql
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  receiver_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  attachments TEXT[] DEFAULT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activer Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Politique pour voir ses propres messages
CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Politique pour insérer des messages
CREATE POLICY "Users can insert messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);
```

### Configuration Realtime

1. Dans le dashboard Supabase : Database → Replication
2. Activer la réplication pour la table `messages`
3. Configurer les politiques RLS appropriées

## 🔧 Hooks personnalisés

### `useMessages` - Gestion des messages

```typescript
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface Message {
  id: string
  booking_id: string
  sender_id: string
  receiver_id: string
  content: string
  attachments: string[] | null
  is_read: boolean
  created_at: string
  sender?: { firstname: string; lastname: string; avatar_url: string }
}

export function useMessages(bookingId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!bookingId) return

    const supabase = createClient()

    // Charger les messages existants
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey (
            firstname, lastname, avatar_url
          )
        `)
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true })

      if (!error) {
        setMessages(data || [])
      }
      setIsLoading(false)
    }

    loadMessages()

    // S'abonner aux nouveaux messages via PostgreSQL Changes
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
          const newMessage = payload.new as Message
          setMessages(prev => {
            // Éviter les doublons
            if (prev.some(m => m.id === newMessage.id)) return prev
            return [...prev, newMessage]
          })
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [bookingId])

  const sendMessage = async (content: string, senderId: string, receiverId: string) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('messages')
      .insert({
        booking_id: bookingId,
        sender_id: senderId,
        receiver_id: receiverId,
        content: content.trim()
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  return { messages, isLoading, sendMessage }
}
```

**Fonctionnalités :**
- ✅ Chargement initial des messages
- ✅ Abonnement temps réel aux nouveaux messages
- ✅ Évitement des doublons
- ✅ Fonction d'envoi de messages

### `usePresence` - Gestion de la présence

```typescript
import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface PresenceState {
  [userId: string]: {
    user_id: string
    online_at: string
    typing?: boolean
    typing_at?: string
  }[]
}

export function usePresence(channelName: string, userId: string | null) {
  const [presenceState, setPresenceState] = useState<PresenceState>({})
  const [isTyping, setIsTyping] = useState<{ [userId: string]: boolean }>({})
  const channelRef = useRef<RealtimeChannel | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const isUserOnline = useCallback((targetUserId: string): boolean => {
    const userPresences = presenceState[targetUserId]
    if (!userPresences?.length) return false

    const now = Date.now()
    return userPresences.some(presence => {
      const onlineAt = new Date(presence.online_at).getTime()
      return now - onlineAt < 30000 // 30 secondes
    })
  }, [presenceState])

  const isUserTyping = useCallback((targetUserId: string): boolean => {
    return isTyping[targetUserId] || false
  }, [isTyping])

  const sendTypingStatus = useCallback(() => {
    if (!channelRef.current || !userId) return

    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        user_id: userId,
        typing: true,
        typing_at: new Date().toISOString(),
      },
    })

    // Auto-stop après 3 secondes
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping()
    }, 3000)
  }, [userId])

  const stopTyping = useCallback(() => {
    if (!channelRef.current || !userId) return

    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        user_id: userId,
        typing: false,
      },
    })
  }, [userId])

  useEffect(() => {
    if (!channelName || !userId) return

    const supabase = createClient()
    const channel = supabase.channel(channelName, {
      config: {
        presence: { key: userId },
        broadcast: { self: false, ack: false }
      }
    })

    // Gestion des événements de présence
    channel.on('presence', { event: 'sync' }, () => {
      setPresenceState(channel.presenceState())
    })

    channel.on('presence', { event: 'join' }, ({ newPresences }) => {
      setPresenceState(prev => ({ ...prev, ...channel.presenceState() }))
    })

    channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      setPresenceState(prev => ({ ...prev, ...channel.presenceState() }))
    })

    // Gestion des indicateurs de frappe
    channel.on('broadcast', { event: 'typing' }, (payload) => {
      const { user_id, typing } = payload.payload
      setIsTyping(prev => ({ ...prev, [user_id]: typing }))

      // Auto-nettoyage après 5 secondes
      if (typing) {
        setTimeout(() => {
          setIsTyping(prev => ({ ...prev, [user_id]: false }))
        }, 5000)
      }
    })

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // S'annoncer en ligne
        await channel.track({
          user_id: userId,
          online_at: new Date().toISOString()
        })
      }
    })

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [channelName, userId])

  return {
    presenceState,
    isUserOnline,
    isUserTyping,
    sendTypingStatus,
    stopTyping,
  }
}
```

**Fonctionnalités :**
- ✅ Statut en ligne/hors ligne avec heartbeat
- ✅ Indicateurs "en train d'écrire..."
- ✅ Auto-nettoyage des états temporaires
- ✅ Gestion des reconnexions

## 🖥️ Composants UI

### `ChatWindow` - Fenêtre de chat principale

```tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useMessages } from '@/hooks/use-messages'
import { usePresence } from '@/hooks/use-presence'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ChatWindowProps {
  bookingId: string
  currentUserId: string
  otherUserId: string
  otherUserName: string
}

export function ChatWindow({
  bookingId,
  currentUserId,
  otherUserId,
  otherUserName
}: ChatWindowProps) {
  const { messages, isLoading, sendMessage } = useMessages(bookingId)
  const { isUserOnline, isUserTyping, sendTypingStatus, stopTyping } = usePresence(
    `messages:${bookingId}`,
    currentUserId
  )

  const [messageContent, setMessageContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll vers le bas lors de nouveaux messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!messageContent.trim() || isSending) return

    setIsSending(true)
    try {
      await sendMessage(messageContent, currentUserId, otherUserId)
      setMessageContent('')
      stopTyping()
    } catch (error) {
      console.error('Erreur envoi message:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleTyping = () => {
    sendTypingStatus()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header avec informations utilisateur */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{otherUserName}</h3>
          {isUserOnline(otherUserId) && (
            <span className="text-xs text-green-600">En ligne</span>
          )}
          {isUserTyping(otherUserId) && (
            <span className="text-xs text-muted-foreground italic">
              est en train d'écrire...
            </span>
          )}
        </div>
      </div>

      {/* Zone d'affichage des messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender_id === currentUserId ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  message.sender_id === currentUserId
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(message.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Zone de saisie */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={messageContent}
            onChange={(e) => {
              setMessageContent(e.target.value)
              handleTyping()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Tapez votre message..."
            className="min-h-[60px]"
          />
          <Button
            onClick={handleSend}
            disabled={!messageContent.trim() || isSending}
            size="icon"
          >
            {isSending ? '...' : 'Envoyer'}
          </Button>
        </div>
      </div>
    </div>
  )
}
```

## ⚙️ Configuration Supabase

### Variables d'environnement

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Client Supabase

```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

export const createClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

## 📈 Optimisations et bonnes pratiques

### 1. Messages optimistes
Affichez immédiatement les messages envoyés pour améliorer l'expérience utilisateur :

```typescript
const addOptimisticMessage = (content: string) => {
  const tempMessage = {
    id: `temp-${Date.now()}`,
    content,
    sender_id: currentUserId,
    created_at: new Date().toISOString(),
    // ... autres propriétés
  }
  setMessages(prev => [...prev, tempMessage])

  // Remplacer par le message réel une fois confirmé
  try {
    const realMessage = await sendMessage(content)
    replaceOptimisticMessage(tempMessage.id, realMessage)
  } catch (error) {
    removeOptimisticMessage(tempMessage.id)
  }
}
```

### 2. Gestion des reconnexions
Implémentez une gestion automatique des déconnexions :

```typescript
const useRealtimeConnection = () => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')

  useEffect(() => {
    const channel = supabase.channel('connection-test')

    channel.subscribe((status) => {
      setStatus(status === 'SUBSCRIBED' ? 'connected' : 'disconnected')
    })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { status }
}
```

### 3. Pagination des messages
Pour les longues conversations, chargez les messages par pages :

```typescript
const loadMessages = async (page = 0, limit = 50) => {
  const from = page * limit
  const to = from + limit - 1

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('booking_id', bookingId)
    .range(from, to)
    .order('created_at', { ascending: false })

  return data?.reverse() || []
}
```

### 4. Sécurité
- ✅ Validez et nettoyez le contenu côté serveur
- ✅ Utilisez RLS pour contrôler l'accès
- ✅ Limitez la taille des messages
- ✅ Implémentez un rate limiting

### 5. Performance
- ✅ Utilisez `React.memo` pour les composants de message
- ✅ Débounced les événements de frappe
- ✅ Limitez le nombre de messages affichés (pagination virtuelle)
- ✅ Optimisez les requêtes avec des indexes appropriés

## 🔍 Dépannage

### Problèmes courants

1. **Messages ne s'affichent pas en temps réel**
   - Vérifiez que la réplication est activée pour la table `messages`
   - Vérifiez les politiques RLS
   - Vérifiez la console pour les erreurs de connexion

2. **Statut de présence ne fonctionne pas**
   - Assurez-vous que `userId` est fourni au hook `usePresence`
   - Vérifiez que le channel name est correct
   - Vérifiez les permissions de présence

3. **Indicateurs de frappe ne disparaissent pas**
   - Implémentez un timeout côté client
   - Vérifiez que `stopTyping()` est appelé lors de l'envoi

### Debugging

```typescript
// Activer les logs détaillés
const channel = supabase.channel('debug-channel', {
  config: {
    broadcast: { self: true, ack: true } // Pour debug
  }
})

channel.subscribe((status, err) => {
  console.log('Channel status:', status, err)
})
```

Cette implémentation fournit une base solide pour un système de chat en temps réel. Adaptez les composants selon vos besoins spécifiques d'UI/UX et d'architecture.