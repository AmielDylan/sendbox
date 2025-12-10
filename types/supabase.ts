/**
 * Types TypeScript générés depuis Supabase
 *
 * Pour générer ce fichier :
 * 1. Se connecter : supabase login
 * 2. Lier le projet : supabase link --project-ref tpvjycjlzxlbrtbvyfsx
 * 3. Générer les types : supabase gen types typescript --linked > types/supabase.ts
 *
 * Ce fichier sera automatiquement remplacé lors de la génération.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          first_name: string | null
          last_name: string | null
          phone: string | null
          avatar_url: string | null
          kyc_status: 'pending' | 'approved' | 'rejected'
          kyc_verified_at: string | null
          kyc_document_type: 'passport' | 'national_id' | null
          kyc_document_number: string | null
          kyc_document_front: string | null
          kyc_document_back: string | null
          kyc_birthday: string | null
          kyc_nationality: string | null
          kyc_address: string | null
          kyc_submitted_at: string | null
          kyc_reviewed_at: string | null
          kyc_rejection_reason: string | null
          address: string | null
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          kyc_status?: 'pending' | 'approved' | 'rejected'
          kyc_verified_at?: string | null
          kyc_document_type?: 'passport' | 'national_id' | null
          kyc_document_number?: string | null
          kyc_document_front?: string | null
          kyc_document_back?: string | null
          kyc_birthday?: string | null
          kyc_nationality?: string | null
          kyc_address?: string | null
          kyc_submitted_at?: string | null
          kyc_reviewed_at?: string | null
          kyc_rejection_reason?: string | null
          address?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          kyc_status?: 'pending' | 'approved' | 'rejected'
          kyc_verified_at?: string | null
          kyc_document_type?: 'passport' | 'national_id' | null
          kyc_document_number?: string | null
          kyc_document_front?: string | null
          kyc_document_back?: string | null
          kyc_birthday?: string | null
          kyc_nationality?: string | null
          kyc_address?: string | null
          kyc_submitted_at?: string | null
          kyc_reviewed_at?: string | null
          kyc_rejection_reason?: string | null
          address?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          id: string
          traveler_id: string
          origin_country: string
          origin_city: string
          destination_country: string
          destination_city: string
          departure_date: string
          max_weight_kg: number
          price_per_kg: number
          status: 'draft' | 'active' | 'completed' | 'cancelled'
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          traveler_id: string
          origin_country: string
          origin_city: string
          destination_country: string
          destination_city: string
          departure_date: string
          max_weight_kg: number
          price_per_kg: number
          status?: 'draft' | 'active' | 'completed' | 'cancelled'
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          traveler_id?: string
          origin_country?: string
          origin_city?: string
          destination_country?: string
          destination_city?: string
          departure_date?: string
          max_weight_kg?: number
          price_per_kg?: number
          status?: 'draft' | 'active' | 'completed' | 'cancelled'
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'announcements_traveler_id_fkey'
            columns: ['traveler_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      bookings: {
        Row: {
          id: string
          announcement_id: string
          sender_id: string
          traveler_id: string
          weight_kg: number
          description: string | null
          status:
            | 'pending'
            | 'confirmed'
            | 'in_transit'
            | 'delivered'
            | 'cancelled'
          qr_code: string | null
          tracking_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          announcement_id: string
          sender_id: string
          traveler_id: string
          weight_kg: number
          description?: string | null
          status?:
            | 'pending'
            | 'confirmed'
            | 'in_transit'
            | 'delivered'
            | 'cancelled'
          qr_code?: string | null
          tracking_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          announcement_id?: string
          sender_id?: string
          traveler_id?: string
          weight_kg?: number
          description?: string | null
          status?:
            | 'pending'
            | 'confirmed'
            | 'in_transit'
            | 'delivered'
            | 'cancelled'
          qr_code?: string | null
          tracking_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'bookings_announcement_id_fkey'
            columns: ['announcement_id']
            isOneToOne: false
            referencedRelation: 'announcements'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'bookings_sender_id_fkey'
            columns: ['sender_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'bookings_traveler_id_fkey'
            columns: ['traveler_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      messages: {
        Row: {
          id: string
          booking_id: string | null
          sender_id: string
          receiver_id: string
          content: string
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id?: string | null
          sender_id: string
          receiver_id: string
          content: string
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string | null
          sender_id?: string
          receiver_id?: string
          content?: string
          read_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'messages_booking_id_fkey'
            columns: ['booking_id']
            isOneToOne: false
            referencedRelation: 'bookings'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'messages_receiver_id_fkey'
            columns: ['receiver_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'messages_sender_id_fkey'
            columns: ['sender_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          read_at: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          read_at?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          read_at?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      ratings: {
        Row: {
          id: string
          booking_id: string
          rater_id: string
          rated_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          rater_id: string
          rated_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          rater_id?: string
          rated_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ratings_booking_id_fkey'
            columns: ['booking_id']
            isOneToOne: false
            referencedRelation: 'bookings'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ratings_rated_id_fkey'
            columns: ['rated_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ratings_rater_id_fkey'
            columns: ['rater_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      transactions: {
        Row: {
          id: string
          booking_id: string
          amount: number
          currency: string
          status: 'pending' | 'completed' | 'failed' | 'refunded'
          stripe_payment_intent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          amount: number
          currency?: string
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          stripe_payment_intent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          amount?: number
          currency?: string
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          stripe_payment_intent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'transactions_booking_id_fkey'
            columns: ['booking_id']
            isOneToOne: false
            referencedRelation: 'bookings'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[keyof Database]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] &
        PublicSchema['Views'])
    ? (PublicSchema['Tables'] &
        PublicSchema['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema['Enums']
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
    ? PublicSchema['Enums'][PublicEnumNameOrOptions]
    : never
