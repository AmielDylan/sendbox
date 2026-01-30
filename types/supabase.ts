export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.5'
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action_type: string
          admin_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          target_id: string
          target_type: string
          user_agent: string | null
        }
        Insert: {
          action_type: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id: string
          target_type: string
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string
          target_type?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'admin_audit_logs_admin_id_fkey'
            columns: ['admin_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'admin_audit_logs_admin_id_fkey'
            columns: ['admin_id']
            isOneToOne: false
            referencedRelation: 'user_stats'
            referencedColumns: ['id']
          },
        ]
      }
      announcements: {
        Row: {
          arrival_city: string
          arrival_country: string
          arrival_date: string
          available_kg: number
          bookings_count: number | null
          created_at: string | null
          departure_city: string
          departure_country: string
          departure_date: string
          description: string | null
          id: string
          price_per_kg: number
          reserved_kg: number | null
          status: Database['public']['Enums']['announcement_status']
          traveler_id: string
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          arrival_city: string
          arrival_country: string
          arrival_date: string
          available_kg?: number
          bookings_count?: number | null
          created_at?: string | null
          departure_city: string
          departure_country: string
          departure_date: string
          description?: string | null
          id?: string
          price_per_kg: number
          reserved_kg?: number | null
          status?: Database['public']['Enums']['announcement_status']
          traveler_id: string
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          arrival_city?: string
          arrival_country?: string
          arrival_date?: string
          available_kg?: number
          bookings_count?: number | null
          created_at?: string | null
          departure_city?: string
          departure_country?: string
          departure_date?: string
          description?: string | null
          id?: string
          price_per_kg?: number
          reserved_kg?: number | null
          status?: Database['public']['Enums']['announcement_status']
          traveler_id?: string
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'announcements_traveler_id_fkey'
            columns: ['traveler_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'announcements_traveler_id_fkey'
            columns: ['traveler_id']
            isOneToOne: false
            referencedRelation: 'user_stats'
            referencedColumns: ['id']
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'audit_logs_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'audit_logs_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user_stats'
            referencedColumns: ['id']
          },
        ]
      }
      bookings: {
        Row: {
          accepted_at: string | null
          announcement_id: string
          cancelled_at: string | null
          cancelled_by: string | null
          cancelled_reason: string | null
          commission_amount: number | null
          commission_rate: number | null
          created_at: string | null
          delivered_at: string | null
          delivery_location_lat: number | null
          delivery_location_lng: number | null
          delivery_photo_url: string | null
          delivery_signature_url: string | null
          deposit_location_lat: number | null
          deposit_location_lng: number | null
          deposit_photo_url: string | null
          deposit_signature_url: string | null
          deposited_at: string | null
          description: string | null
          dispute_opened_at: string | null
          dispute_reason: string | null
          dispute_resolved_at: string | null
          disputed_reason: string | null
          id: string
          insurance_coverage: number | null
          insurance_opted: boolean | null
          insurance_premium: number | null
          kilos_requested: number
          package_description: string
          package_photos: string[] | null
          package_value: number | null
          paid_at: string | null
          payment_intent_id: string | null
          payout_at: string | null
          payout_id: string | null
          price_per_kg: number
          qr_code: string
          refused_at: string | null
          refused_reason: string | null
          sender_id: string
          status: Database['public']['Enums']['booking_status']
          total_price: number
          tracking_number: string | null
          traveler_id: string
          updated_at: string | null
          weight_kg: number | null
        }
        Insert: {
          accepted_at?: string | null
          announcement_id: string
          cancelled_at?: string | null
          cancelled_by?: string | null
          cancelled_reason?: string | null
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_location_lat?: number | null
          delivery_location_lng?: number | null
          delivery_photo_url?: string | null
          delivery_signature_url?: string | null
          deposit_location_lat?: number | null
          deposit_location_lng?: number | null
          deposit_photo_url?: string | null
          deposit_signature_url?: string | null
          deposited_at?: string | null
          description?: string | null
          dispute_opened_at?: string | null
          dispute_reason?: string | null
          dispute_resolved_at?: string | null
          disputed_reason?: string | null
          id?: string
          insurance_coverage?: number | null
          insurance_opted?: boolean | null
          insurance_premium?: number | null
          kilos_requested: number
          package_description: string
          package_photos?: string[] | null
          package_value?: number | null
          paid_at?: string | null
          payment_intent_id?: string | null
          payout_at?: string | null
          payout_id?: string | null
          price_per_kg: number
          qr_code: string
          refused_at?: string | null
          refused_reason?: string | null
          sender_id: string
          status?: Database['public']['Enums']['booking_status']
          total_price?: number
          tracking_number?: string | null
          traveler_id: string
          updated_at?: string | null
          weight_kg?: number | null
        }
        Update: {
          accepted_at?: string | null
          announcement_id?: string
          cancelled_at?: string | null
          cancelled_by?: string | null
          cancelled_reason?: string | null
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_location_lat?: number | null
          delivery_location_lng?: number | null
          delivery_photo_url?: string | null
          delivery_signature_url?: string | null
          deposit_location_lat?: number | null
          deposit_location_lng?: number | null
          deposit_photo_url?: string | null
          deposit_signature_url?: string | null
          deposited_at?: string | null
          description?: string | null
          dispute_opened_at?: string | null
          dispute_reason?: string | null
          dispute_resolved_at?: string | null
          disputed_reason?: string | null
          id?: string
          insurance_coverage?: number | null
          insurance_opted?: boolean | null
          insurance_premium?: number | null
          kilos_requested?: number
          package_description?: string
          package_photos?: string[] | null
          package_value?: number | null
          paid_at?: string | null
          payment_intent_id?: string | null
          payout_at?: string | null
          payout_id?: string | null
          price_per_kg?: number
          qr_code?: string
          refused_at?: string | null
          refused_reason?: string | null
          sender_id?: string
          status?: Database['public']['Enums']['booking_status']
          total_price?: number
          tracking_number?: string | null
          traveler_id?: string
          updated_at?: string | null
          weight_kg?: number | null
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
            foreignKeyName: 'bookings_cancelled_by_fkey'
            columns: ['cancelled_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'bookings_cancelled_by_fkey'
            columns: ['cancelled_by']
            isOneToOne: false
            referencedRelation: 'user_stats'
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
            foreignKeyName: 'bookings_sender_id_fkey'
            columns: ['sender_id']
            isOneToOne: false
            referencedRelation: 'user_stats'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'bookings_traveler_id_fkey'
            columns: ['traveler_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'bookings_traveler_id_fkey'
            columns: ['traveler_id']
            isOneToOne: false
            referencedRelation: 'user_stats'
            referencedColumns: ['id']
          },
        ]
      }
      messages: {
        Row: {
          attachments: string[] | null
          booking_id: string | null
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          attachments?: string[] | null
          booking_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          attachments?: string[] | null
          booking_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
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
            foreignKeyName: 'messages_receiver_id_fkey'
            columns: ['receiver_id']
            isOneToOne: false
            referencedRelation: 'user_stats'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'messages_sender_id_fkey'
            columns: ['sender_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'messages_sender_id_fkey'
            columns: ['sender_id']
            isOneToOne: false
            referencedRelation: 'user_stats'
            referencedColumns: ['id']
          },
        ]
      }
      notifications: {
        Row: {
          announcement_id: string | null
          booking_id: string | null
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          read_at: string | null
          title: string
          type: Database['public']['Enums']['notification_type']
          user_id: string
        }
        Insert: {
          announcement_id?: string | null
          booking_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          read_at?: string | null
          title: string
          type: Database['public']['Enums']['notification_type']
          user_id: string
        }
        Update: {
          announcement_id?: string | null
          booking_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          read_at?: string | null
          title?: string
          type?: Database['public']['Enums']['notification_type']
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notifications_announcement_id_fkey'
            columns: ['announcement_id']
            isOneToOne: false
            referencedRelation: 'announcements'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notifications_booking_id_fkey'
            columns: ['booking_id']
            isOneToOne: false
            referencedRelation: 'bookings'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notifications_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notifications_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user_stats'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          banned_at: string | null
          banned_reason: string | null
          bio: string | null
          birthday: string | null
          completed_services: number | null
          country: string | null
          created_at: string | null
          document_back_url: string | null
          document_front_url: string | null
          document_number: string | null
          document_type: Database['public']['Enums']['document_type'] | null
          email: string
          firstname: string | null
          id: string
          is_banned: boolean | null
          kyc_address: string | null
          kyc_approved_at: string | null
          kyc_birthday: string | null
          kyc_document_back: string | null
          kyc_document_front: string | null
          kyc_document_number: string | null
          kyc_document_type: string | null
          kyc_nationality: string | null
          kyc_rejected_reason: string | null
          kyc_rejection_reason: string | null
          kyc_reviewed_at: string | null
          kyc_status: Database['public']['Enums']['kyc_status']
          kyc_submitted_at: string | null
          last_active_at: string | null
          lastname: string | null
          nationality: string | null
          phone: string | null
          rating: number | null
          role: Database['public']['Enums']['user_role']
          total_services: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          banned_at?: string | null
          banned_reason?: string | null
          bio?: string | null
          birthday?: string | null
          completed_services?: number | null
          country?: string | null
          created_at?: string | null
          document_back_url?: string | null
          document_front_url?: string | null
          document_number?: string | null
          document_type?: Database['public']['Enums']['document_type'] | null
          email: string
          firstname?: string | null
          id: string
          is_banned?: boolean | null
          kyc_address?: string | null
          kyc_approved_at?: string | null
          kyc_birthday?: string | null
          kyc_document_back?: string | null
          kyc_document_front?: string | null
          kyc_document_number?: string | null
          kyc_document_type?: string | null
          kyc_nationality?: string | null
          kyc_rejected_reason?: string | null
          kyc_rejection_reason?: string | null
          kyc_reviewed_at?: string | null
          kyc_status?: Database['public']['Enums']['kyc_status']
          kyc_submitted_at?: string | null
          last_active_at?: string | null
          lastname?: string | null
          nationality?: string | null
          phone?: string | null
          rating?: number | null
          role?: Database['public']['Enums']['user_role']
          total_services?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          banned_at?: string | null
          banned_reason?: string | null
          bio?: string | null
          birthday?: string | null
          completed_services?: number | null
          country?: string | null
          created_at?: string | null
          document_back_url?: string | null
          document_front_url?: string | null
          document_number?: string | null
          document_type?: Database['public']['Enums']['document_type'] | null
          email?: string
          firstname?: string | null
          id?: string
          is_banned?: boolean | null
          kyc_address?: string | null
          kyc_approved_at?: string | null
          kyc_birthday?: string | null
          kyc_document_back?: string | null
          kyc_document_front?: string | null
          kyc_document_number?: string | null
          kyc_document_type?: string | null
          kyc_nationality?: string | null
          kyc_rejected_reason?: string | null
          kyc_rejection_reason?: string | null
          kyc_reviewed_at?: string | null
          kyc_status?: Database['public']['Enums']['kyc_status']
          kyc_submitted_at?: string | null
          last_active_at?: string | null
          lastname?: string | null
          nationality?: string | null
          phone?: string | null
          rating?: number | null
          role?: Database['public']['Enums']['user_role']
          total_services?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      qr_scan_logs: {
        Row: {
          booking_id: string | null
          created_at: string | null
          id: string
          location_lat: number | null
          location_lng: number | null
          photo_url: string | null
          qr_code: string
          scan_type: string
          scanned_by: string | null
          signature_url: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          photo_url?: string | null
          qr_code: string
          scan_type: string
          scanned_by?: string | null
          signature_url?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          photo_url?: string | null
          qr_code?: string
          scan_type?: string
          scanned_by?: string | null
          signature_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'qr_scan_logs_booking_id_fkey'
            columns: ['booking_id']
            isOneToOne: false
            referencedRelation: 'bookings'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'qr_scan_logs_scanned_by_fkey'
            columns: ['scanned_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'qr_scan_logs_scanned_by_fkey'
            columns: ['scanned_by']
            isOneToOne: false
            referencedRelation: 'user_stats'
            referencedColumns: ['id']
          },
        ]
      }
      ratings: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string | null
          id: string
          rated_id: string
          rater_id: string
          rating: number
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string | null
          id?: string
          rated_id: string
          rater_id: string
          rating: number
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          rated_id?: string
          rater_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: 'ratings_booking_id_fkey'
            columns: ['booking_id']
            isOneToOne: true
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
            foreignKeyName: 'ratings_rated_id_fkey'
            columns: ['rated_id']
            isOneToOne: false
            referencedRelation: 'user_stats'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ratings_rater_id_fkey'
            columns: ['rater_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ratings_rater_id_fkey'
            columns: ['rater_id']
            isOneToOne: false
            referencedRelation: 'user_stats'
            referencedColumns: ['id']
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          booking_id: string
          created_at: string | null
          currency: string
          id: string
          metadata: Json | null
          stripe_charge_id: string | null
          stripe_payment_intent_id: string | null
          stripe_payout_id: string | null
          stripe_transfer_id: string | null
          status: Database['public']['Enums']['transaction_status']
          type: Database['public']['Enums']['transaction_type']
          user_id: string
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string | null
          currency?: string
          id?: string
          metadata?: Json | null
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_payout_id?: string | null
          stripe_transfer_id?: string | null
          status?: Database['public']['Enums']['transaction_status']
          type: Database['public']['Enums']['transaction_type']
          user_id: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string | null
          currency?: string
          id?: string
          metadata?: Json | null
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_payout_id?: string | null
          stripe_transfer_id?: string | null
          status?: Database['public']['Enums']['transaction_status']
          type?: Database['public']['Enums']['transaction_type']
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'transactions_booking_id_fkey'
            columns: ['booking_id']
            isOneToOne: false
            referencedRelation: 'bookings'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user_stats'
            referencedColumns: ['id']
          },
        ]
      }
      feedback: {
        Row: {
          created_at: string | null
          id: string
          message: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'feedback_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'feedback_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user_stats'
            referencedColumns: ['id']
          },
        ]
      }
      waitlist: {
        Row: {
          created_at: string | null
          email: string
          id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      user_stats: {
        Row: {
          active_announcements: number | null
          completed_services: number | null
          email: string | null
          firstname: string | null
          id: string | null
          lastname: string | null
          pending_bookings_as_sender: number | null
          pending_bookings_as_traveler: number | null
          rating: number | null
          role: Database['public']['Enums']['user_role'] | null
          total_services: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      count_search_announcements: {
        Args: {
          p_arrival_country?: string
          p_departure_country?: string
          p_departure_date?: string
          p_min_kg?: number
        }
        Returns: number
      }
      count_unread_notifications: {
        Args: { p_user_id: string }
        Returns: number
      }
      create_admin_audit_log: {
        Args: {
          p_action_type: string
          p_admin_id: string
          p_details?: Json
          p_ip_address?: string
          p_target_id: string
          p_target_type: string
          p_user_agent?: string
        }
        Returns: string
      }
      create_notification:
        | {
            Args: {
              p_announcement_id?: string
              p_booking_id?: string
              p_content: string
              p_link?: string
              p_title: string
              p_type: Database['public']['Enums']['notification_type']
              p_user_id: string
            }
            Returns: string
          }
        | {
            Args: {
              p_announcement_id?: string
              p_booking_id?: string
              p_content: string
              p_title: string
              p_type: string
              p_user_id: string
            }
            Returns: string
          }
      generate_booking_qr_code: { Args: never; Returns: string }
      get_user_conversations: {
        Args: { p_user_id: string }
        Returns: {
          booking_id: string
          last_message_content: string
          last_message_created_at: string
          other_user_avatar_url: string
          other_user_first_name: string
          other_user_id: string
          other_user_last_name: string
          unread_count: number
        }[]
      }
      increment_announcement_views: {
        Args: { p_announcement_id: string }
        Returns: undefined
      }
      increment_completed_services: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      is_admin: { Args: { user_id: string }; Returns: boolean }
      search_announcements: {
        Args: {
          p_arrival_country?: string
          p_departure_country?: string
          p_departure_date?: string
          p_limit?: number
          p_min_kg?: number
          p_offset?: number
          p_sort_by?: string
        }
        Returns: {
          arrival_city: string
          arrival_country: string
          available_kg: number
          created_at: string
          departure_city: string
          departure_country: string
          departure_date: string
          description: string
          id: string
          match_score: number
          price_per_kg: number
          status: string
          traveler_avatar_url: string
          traveler_firstname: string
          traveler_id: string
          traveler_lastname: string
          traveler_rating: number
          traveler_services_count: number
          updated_at: string
        }[]
      }
    }
    Enums: {
      announcement_status:
        | 'draft'
        | 'published'
        | 'partially_booked'
        | 'fully_booked'
        | 'completed'
        | 'cancelled'
        | 'active'
      booking_status:
        | 'pending'
        | 'accepted'
        | 'refused'
        | 'paid'
        | 'deposited'
        | 'in_transit'
        | 'delivered'
        | 'cancelled'
        | 'disputed'
      document_type: 'passport' | 'national_id' | 'driving_license'
      kyc_status: 'pending' | 'approved' | 'rejected' | 'incomplete'
      notification_type:
        | 'booking_request'
        | 'booking_accepted'
        | 'booking_refused'
        | 'payment_confirmed'
        | 'deposit_reminder'
        | 'transit_started'
        | 'delivery_reminder'
        | 'rating_request'
        | 'admin_message'
        | 'system_alert'
      transaction_type:
        | 'payment'
        | 'commission'
        | 'insurance'
        | 'payout'
        | 'refund'
      transaction_status: 'pending' | 'completed' | 'failed' | 'refunded'
      user_role: 'user' | 'partner' | 'admin'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database['storage']['Enums']['buckettype']
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database['storage']['Enums']['buckettype']
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database['storage']['Enums']['buckettype']
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database['storage']['Enums']['buckettype']
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database['storage']['Enums']['buckettype']
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database['storage']['Enums']['buckettype']
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database['storage']['Enums']['buckettype']
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database['storage']['Enums']['buckettype']
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database['storage']['Enums']['buckettype']
          updated_at?: string
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          level: number | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          level?: number | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          level?: number | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'objects_bucketId_fkey'
            columns: ['bucket_id']
            isOneToOne: false
            referencedRelation: 'buckets'
            referencedColumns: ['id']
          },
        ]
      }
      prefixes: {
        Row: {
          bucket_id: string
          created_at: string | null
          level: number
          name: string
          updated_at: string | null
        }
        Insert: {
          bucket_id: string
          created_at?: string | null
          level?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          bucket_id?: string
          created_at?: string | null
          level?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'prefixes_bucketId_fkey'
            columns: ['bucket_id']
            isOneToOne: false
            referencedRelation: 'buckets'
            referencedColumns: ['id']
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: 's3_multipart_uploads_bucket_id_fkey'
            columns: ['bucket_id']
            isOneToOne: false
            referencedRelation: 'buckets'
            referencedColumns: ['id']
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: 's3_multipart_uploads_parts_bucket_id_fkey'
            columns: ['bucket_id']
            isOneToOne: false
            referencedRelation: 'buckets'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 's3_multipart_uploads_parts_upload_id_fkey'
            columns: ['upload_id']
            isOneToOne: false
            referencedRelation: 's3_multipart_uploads'
            referencedColumns: ['id']
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'vector_indexes_bucket_id_fkey'
            columns: ['bucket_id']
            isOneToOne: false
            referencedRelation: 'buckets_vectors'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_prefixes: {
        Args: { _bucket_id: string; _name: string }
        Returns: undefined
      }
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      delete_leaf_prefixes: {
        Args: { bucket_ids: string[]; names: string[] }
        Returns: undefined
      }
      delete_prefix: {
        Args: { _bucket_id: string; _name: string }
        Returns: boolean
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_level: { Args: { name: string }; Returns: number }
      get_prefix: { Args: { name: string }; Returns: string }
      get_prefixes: { Args: { name: string }; Returns: string[] }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          start_after?: string
        }
        Returns: {
          id: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      lock_top_prefixes: {
        Args: { bucket_ids: string[]; names: string[] }
        Returns: undefined
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_legacy_v1: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v1_optimised: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: 'STANDARD' | 'ANALYTICS' | 'VECTOR'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      announcement_status: [
        'draft',
        'published',
        'partially_booked',
        'fully_booked',
        'completed',
        'cancelled',
        'active',
      ],
      booking_status: [
        'pending',
        'accepted',
        'refused',
        'paid',
        'deposited',
        'in_transit',
        'delivered',
        'cancelled',
        'disputed',
      ],
      document_type: ['passport', 'national_id', 'driving_license'],
      kyc_status: ['pending', 'approved', 'rejected', 'incomplete'],
      notification_type: [
        'booking_request',
        'booking_accepted',
        'booking_refused',
        'payment_confirmed',
        'deposit_reminder',
        'transit_started',
        'delivery_reminder',
        'rating_request',
        'admin_message',
        'system_alert',
      ],
      transaction_type: [
        'payment',
        'commission',
        'insurance',
        'payout',
        'refund',
      ],
      user_role: ['user', 'partner', 'admin'],
    },
  },
  storage: {
    Enums: {
      buckettype: ['STANDARD', 'ANALYTICS', 'VECTOR'],
    },
  },
} as const
