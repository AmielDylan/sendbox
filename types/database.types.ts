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
          is_sendbox: boolean | null
          price_per_kg: number
          reserved_kg: number | null
          sendbox_available: boolean | null
          status: Database['public']['Enums']['announcement_status']
          travel_proof_url: string | null
          travel_proof_verified: boolean
          travel_proof_verified_at: string | null
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
          is_sendbox?: boolean | null
          price_per_kg: number
          reserved_kg?: number | null
          sendbox_available?: boolean | null
          status?: Database['public']['Enums']['announcement_status']
          travel_proof_url?: string | null
          travel_proof_verified?: boolean
          travel_proof_verified_at?: string | null
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
          is_sendbox?: boolean | null
          price_per_kg?: number
          reserved_kg?: number | null
          sendbox_available?: boolean | null
          status?: Database['public']['Enums']['announcement_status']
          travel_proof_url?: string | null
          travel_proof_verified?: boolean
          travel_proof_verified_at?: string | null
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
        ]
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
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
        ]
      }
      booking_photos: {
        Row: {
          booking_id: string
          captured_at: string
          confirmed_by_id: string | null
          created_at: string
          file_hash: string
          id: string
          size_bytes: number
          type: Database['public']['Enums']['photo_type_enum']
          uploaded_by_id: string
          url: string
        }
        Insert: {
          booking_id: string
          captured_at?: string
          confirmed_by_id?: string | null
          created_at?: string
          file_hash: string
          id?: string
          size_bytes: number
          type: Database['public']['Enums']['photo_type_enum']
          uploaded_by_id: string
          url: string
        }
        Update: {
          booking_id?: string
          captured_at?: string
          confirmed_by_id?: string | null
          created_at?: string
          file_hash?: string
          id?: string
          size_bytes?: number
          type?: Database['public']['Enums']['photo_type_enum']
          uploaded_by_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: 'booking_photos_booking_id_fkey'
            columns: ['booking_id']
            isOneToOne: false
            referencedRelation: 'bookings'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'booking_photos_confirmed_by_id_fkey'
            columns: ['confirmed_by_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'booking_photos_uploaded_by_id_fkey'
            columns: ['uploaded_by_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      bookings: {
        Row: {
          accepted_at: string | null
          announcement_id: string
          auto_release_at: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          cancelled_reason: string | null
          commission_amount: number | null
          commission_rate: number | null
          completed_at: string | null
          created_at: string | null
          delivered_at: string | null
          delivery_confirmed_at: string | null
          delivery_confirmed_by: string | null
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
          duration_hours: number | null
          flag_reason: string | null
          handed_at: string | null
          id: string
          insurance_coverage: number | null
          insurance_opted: boolean | null
          insurance_premium: number | null
          is_flagged: boolean | null
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
          released_at: string | null
          sender_confirmed_at: string | null
          sender_id: string
          status: Database['public']['Enums']['booking_status']
          status_history: Json | null
          total_price: number
          tracking_number: string | null
          traveler_confirmed_at: string | null
          traveler_id: string
          updated_at: string | null
          weight_kg: number | null
        }
        Insert: {
          accepted_at?: string | null
          announcement_id: string
          auto_release_at?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          cancelled_reason?: string | null
          commission_amount?: number | null
          commission_rate?: number | null
          completed_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_confirmed_at?: string | null
          delivery_confirmed_by?: string | null
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
          duration_hours?: number | null
          flag_reason?: string | null
          handed_at?: string | null
          id?: string
          insurance_coverage?: number | null
          insurance_opted?: boolean | null
          insurance_premium?: number | null
          is_flagged?: boolean | null
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
          released_at?: string | null
          sender_confirmed_at?: string | null
          sender_id: string
          status?: Database['public']['Enums']['booking_status']
          status_history?: Json | null
          total_price?: number
          tracking_number?: string | null
          traveler_confirmed_at?: string | null
          traveler_id: string
          updated_at?: string | null
          weight_kg?: number | null
        }
        Update: {
          accepted_at?: string | null
          announcement_id?: string
          auto_release_at?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          cancelled_reason?: string | null
          commission_amount?: number | null
          commission_rate?: number | null
          completed_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_confirmed_at?: string | null
          delivery_confirmed_by?: string | null
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
          duration_hours?: number | null
          flag_reason?: string | null
          handed_at?: string | null
          id?: string
          insurance_coverage?: number | null
          insurance_opted?: boolean | null
          insurance_premium?: number | null
          is_flagged?: boolean | null
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
          released_at?: string | null
          sender_confirmed_at?: string | null
          sender_id?: string
          status?: Database['public']['Enums']['booking_status']
          status_history?: Json | null
          total_price?: number
          tracking_number?: string | null
          traveler_confirmed_at?: string | null
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
            foreignKeyName: 'bookings_delivery_confirmed_by_fkey'
            columns: ['delivery_confirmed_by']
            isOneToOne: false
            referencedRelation: 'profiles'
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
      booking_reports: {
        Row: {
          admin_note: string | null
          booking_id: string
          created_at: string
          id: string
          message: string
          reason: string
          reported_by: string
          reported_user_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          suggested_new_date: string | null
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          booking_id: string
          created_at?: string
          id?: string
          message: string
          reason: string
          reported_by: string
          reported_user_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          suggested_new_date?: string | null
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          booking_id?: string
          created_at?: string
          id?: string
          message?: string
          reason?: string
          reported_by?: string
          reported_user_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          suggested_new_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'booking_reports_booking_id_fkey'
            columns: ['booking_id']
            isOneToOne: false
            referencedRelation: 'bookings'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'booking_reports_reported_by_fkey'
            columns: ['reported_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'booking_reports_reported_user_id_fkey'
            columns: ['reported_user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'booking_reports_resolved_by_fkey'
            columns: ['resolved_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      cron_job_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          job_name: string
          last_run_at: string | null
          next_run_at: string | null
          processed_count: number | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          job_name: string
          last_run_at?: string | null
          next_run_at?: string | null
          processed_count?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          job_name?: string
          last_run_at?: string | null
          next_run_at?: string | null
          processed_count?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      disputes: {
        Row: {
          admin_note: string | null
          booking_id: string
          description: string | null
          id: string
          is_public: boolean | null
          opened_at: string
          opened_by_id: string | null
          reason: string | null
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          admin_note?: string | null
          booking_id: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          opened_at?: string
          opened_by_id?: string | null
          reason?: string | null
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          admin_note?: string | null
          booking_id?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          opened_at?: string
          opened_by_id?: string | null
          reason?: string | null
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: 'disputes_booking_id_fkey'
            columns: ['booking_id']
            isOneToOne: false
            referencedRelation: 'bookings'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'disputes_opened_by_id_fkey'
            columns: ['opened_by_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'disputes_resolved_by_fkey'
            columns: ['resolved_by']
            isOneToOne: false
            referencedRelation: 'profiles'
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
        ]
      }
      kyc_reviews: {
        Row: {
          admin_id: string | null
          consent_at: string | null
          created_at: string
          id: string
          mrz_birth_date: string | null
          mrz_expired: boolean | null
          mrz_expiry: string | null
          mrz_name: string | null
          mrz_nationality: string | null
          mrz_raw: string | null
          mrz_valid: boolean | null
          ocr_confidence: number | null
          reviewed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          admin_id?: string | null
          consent_at?: string | null
          created_at?: string
          id?: string
          mrz_birth_date?: string | null
          mrz_expired?: boolean | null
          mrz_expiry?: string | null
          mrz_name?: string | null
          mrz_nationality?: string | null
          mrz_raw?: string | null
          mrz_valid?: boolean | null
          ocr_confidence?: number | null
          reviewed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          admin_id?: string | null
          consent_at?: string | null
          created_at?: string
          id?: string
          mrz_birth_date?: string | null
          mrz_expired?: boolean | null
          mrz_expiry?: string | null
          mrz_name?: string | null
          mrz_nationality?: string | null
          mrz_raw?: string | null
          mrz_valid?: boolean | null
          ocr_confidence?: number | null
          reviewed_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'kyc_reviews_admin_id_fkey'
            columns: ['admin_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'kyc_reviews_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      matching_payments: {
        Row: {
          amount_cents: number
          booking_id: string
          created_at: string
          currency: string
          id: string
          paid_by: string
          status: string
          stripe_client_secret: string
          stripe_payment_intent_id: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          booking_id: string
          created_at?: string
          currency?: string
          id?: string
          paid_by: string
          status?: string
          stripe_client_secret: string
          stripe_payment_intent_id: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          booking_id?: string
          created_at?: string
          currency?: string
          id?: string
          paid_by?: string
          status?: string
          stripe_client_secret?: string
          stripe_payment_intent_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'matching_payments_booking_id_fkey'
            columns: ['booking_id']
            isOneToOne: false
            referencedRelation: 'bookings'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'matching_payments_paid_by_fkey'
            columns: ['paid_by']
            isOneToOne: false
            referencedRelation: 'profiles'
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
          updated_at: string | null
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
          updated_at?: string | null
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
          updated_at?: string | null
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
        ]
      }
      payments: {
        Row: {
          amount_total: number
          booking_id: string
          captured_at: string | null
          created_at: string
          currency: string
          id: string
          platform_fee: number
          status: Database['public']['Enums']['payment_status_enum']
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount_total: number
          booking_id: string
          captured_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          platform_fee?: number
          status?: Database['public']['Enums']['payment_status_enum']
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount_total?: number
          booking_id?: string
          captured_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          platform_fee?: number
          status?: Database['public']['Enums']['payment_status_enum']
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'payments_booking_id_fkey'
            columns: ['booking_id']
            isOneToOne: false
            referencedRelation: 'bookings'
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
          cgu_accepted_at: string | null
          city: string | null
          completed_count: number | null
          completed_services: number | null
          country: string | null
          created_at: string | null
          disputed_count: number | null
          email: string
          fedapay_id: string | null
          firstname: string | null
          flutterwave_bank_account_name: string | null
          flutterwave_bank_account_number: string | null
          flutterwave_bank_code: string | null
          flutterwave_recipient_currency: string | null
          flutterwave_recipient_id: string | null
          flutterwave_recipient_type: string | null
          flutterwave_subaccount_id: string | null
          id: string
          is_banned: boolean | null
          is_suspended: boolean | null
          kyc_document_back: string | null
          kyc_document_front: string | null
          kyc_document_type: string | null
          kyc_nationality: string | null
          kyc_rejection_reason: string | null
          kyc_reviewed_at: string | null
          kyc_selfie: string | null
          kyc_status: Database['public']['Enums']['kyc_status']
          kyc_submitted_at: string | null
          lastname: string | null
          payout_error_at: string | null
          payout_error_code: string | null
          payout_error_message: string | null
          payout_method: string | null
          payout_provider: string | null
          payout_status: string | null
          phone: string | null
          postal_code: string | null
          rating: number | null
          role: Database['public']['Enums']['user_role']
          stripe_connect_account_id: string | null
          stripe_customer_id: string | null
          stripe_onboarding_completed: boolean
          stripe_payouts_enabled: boolean
          stripe_requirements: Json | null
          stripe_subscription_id: string | null
          subscription_expires_at: string | null
          subscription_started_at: string | null
          subscription_status: Database['public']['Enums']['subscription_status_enum']
          suspended_reason: string | null
          trial_ends_at: string | null
          trust_score: number | null
          unique_sender_count: number | null
          unique_traveler_count: number | null
          updated_at: string | null
          verification_status:
            | Database['public']['Enums']['verification_status_enum']
            | null
          verified_at: string | null
          verified_name: string | null
          wallet_operator: string | null
          wallet_otp_code: string | null
          wallet_otp_expires_at: string | null
          wallet_phone: string | null
          wallet_verified_at: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          banned_at?: string | null
          banned_reason?: string | null
          bio?: string | null
          birthday?: string | null
          cgu_accepted_at?: string | null
          city?: string | null
          completed_count?: number | null
          completed_services?: number | null
          country?: string | null
          created_at?: string | null
          disputed_count?: number | null
          email: string
          fedapay_id?: string | null
          firstname?: string | null
          flutterwave_bank_account_name?: string | null
          flutterwave_bank_account_number?: string | null
          flutterwave_bank_code?: string | null
          flutterwave_recipient_currency?: string | null
          flutterwave_recipient_id?: string | null
          flutterwave_recipient_type?: string | null
          flutterwave_subaccount_id?: string | null
          id: string
          is_banned?: boolean | null
          is_suspended?: boolean | null
          kyc_document_back?: string | null
          kyc_document_front?: string | null
          kyc_document_type?: string | null
          kyc_nationality?: string | null
          kyc_rejection_reason?: string | null
          kyc_reviewed_at?: string | null
          kyc_selfie?: string | null
          kyc_status?: Database['public']['Enums']['kyc_status']
          kyc_submitted_at?: string | null
          lastname?: string | null
          payout_error_at?: string | null
          payout_error_code?: string | null
          payout_error_message?: string | null
          payout_method?: string | null
          payout_provider?: string | null
          payout_status?: string | null
          phone?: string | null
          postal_code?: string | null
          rating?: number | null
          role?: Database['public']['Enums']['user_role']
          stripe_connect_account_id?: string | null
          stripe_customer_id?: string | null
          stripe_onboarding_completed?: boolean
          stripe_payouts_enabled?: boolean
          stripe_requirements?: Json | null
          stripe_subscription_id?: string | null
          subscription_expires_at?: string | null
          subscription_started_at?: string | null
          subscription_status?: Database['public']['Enums']['subscription_status_enum']
          suspended_reason?: string | null
          trial_ends_at?: string | null
          trust_score?: number | null
          unique_sender_count?: number | null
          unique_traveler_count?: number | null
          updated_at?: string | null
          verification_status?:
            | Database['public']['Enums']['verification_status_enum']
            | null
          verified_at?: string | null
          verified_name?: string | null
          wallet_operator?: string | null
          wallet_otp_code?: string | null
          wallet_otp_expires_at?: string | null
          wallet_phone?: string | null
          wallet_verified_at?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          banned_at?: string | null
          banned_reason?: string | null
          bio?: string | null
          birthday?: string | null
          cgu_accepted_at?: string | null
          city?: string | null
          completed_count?: number | null
          completed_services?: number | null
          country?: string | null
          created_at?: string | null
          disputed_count?: number | null
          email?: string
          fedapay_id?: string | null
          firstname?: string | null
          flutterwave_bank_account_name?: string | null
          flutterwave_bank_account_number?: string | null
          flutterwave_bank_code?: string | null
          flutterwave_recipient_currency?: string | null
          flutterwave_recipient_id?: string | null
          flutterwave_recipient_type?: string | null
          flutterwave_subaccount_id?: string | null
          id?: string
          is_banned?: boolean | null
          is_suspended?: boolean | null
          kyc_document_back?: string | null
          kyc_document_front?: string | null
          kyc_document_type?: string | null
          kyc_nationality?: string | null
          kyc_rejection_reason?: string | null
          kyc_reviewed_at?: string | null
          kyc_selfie?: string | null
          kyc_status?: Database['public']['Enums']['kyc_status']
          kyc_submitted_at?: string | null
          lastname?: string | null
          payout_error_at?: string | null
          payout_error_code?: string | null
          payout_error_message?: string | null
          payout_method?: string | null
          payout_provider?: string | null
          payout_status?: string | null
          phone?: string | null
          postal_code?: string | null
          rating?: number | null
          role?: Database['public']['Enums']['user_role']
          stripe_connect_account_id?: string | null
          stripe_customer_id?: string | null
          stripe_onboarding_completed?: boolean
          stripe_payouts_enabled?: boolean
          stripe_requirements?: Json | null
          stripe_subscription_id?: string | null
          subscription_expires_at?: string | null
          subscription_started_at?: string | null
          subscription_status?: Database['public']['Enums']['subscription_status_enum']
          suspended_reason?: string | null
          trial_ends_at?: string | null
          trust_score?: number | null
          unique_sender_count?: number | null
          unique_traveler_count?: number | null
          updated_at?: string | null
          verification_status?:
            | Database['public']['Enums']['verification_status_enum']
            | null
          verified_at?: string | null
          verified_name?: string | null
          wallet_operator?: string | null
          wallet_otp_code?: string | null
          wallet_otp_expires_at?: string | null
          wallet_phone?: string | null
          wallet_verified_at?: string | null
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
        ]
      }
      ratings: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string | null
          id: string
          published_at: string | null
          rated_id: string
          rater_id: string
          rating: number
          status: Database['public']['Enums']['review_status_enum'] | null
          submitted_at: string | null
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string | null
          id?: string
          published_at?: string | null
          rated_id: string
          rater_id: string
          rating: number
          status?: Database['public']['Enums']['review_status_enum'] | null
          submitted_at?: string | null
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          published_at?: string | null
          rated_id?: string
          rater_id?: string
          rating?: number
          status?: Database['public']['Enums']['review_status_enum'] | null
          submitted_at?: string | null
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
          amount: number
          booking_id: string
          created_at: string | null
          currency: string
          id: string
          metadata: Json | null
          status: Database['public']['Enums']['transaction_status_enum']
          stripe_charge_id: string | null
          stripe_payment_intent_id: string | null
          stripe_payout_id: string | null
          stripe_transfer_id: string | null
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
          status?: Database['public']['Enums']['transaction_status_enum']
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_payout_id?: string | null
          stripe_transfer_id?: string | null
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
          status?: Database['public']['Enums']['transaction_status_enum']
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_payout_id?: string | null
          stripe_transfer_id?: string | null
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
        ]
      }
      transfers: {
        Row: {
          amount: number
          attempted_at: string | null
          booking_id: string
          created_at: string
          currency: string
          external_transfer_id: string | null
          id: string
          payout_provider: string | null
          status: Database['public']['Enums']['transfer_status_enum']
          stripe_transfer_id: string | null
        }
        Insert: {
          amount: number
          attempted_at?: string | null
          booking_id: string
          created_at?: string
          currency?: string
          external_transfer_id?: string | null
          id?: string
          payout_provider?: string | null
          status?: Database['public']['Enums']['transfer_status_enum']
          stripe_transfer_id?: string | null
        }
        Update: {
          amount?: number
          attempted_at?: string | null
          booking_id?: string
          created_at?: string
          currency?: string
          external_transfer_id?: string | null
          id?: string
          payout_provider?: string | null
          status?: Database['public']['Enums']['transfer_status_enum']
          stripe_transfer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'transfers_booking_id_fkey'
            columns: ['booking_id']
            isOneToOne: false
            referencedRelation: 'bookings'
            referencedColumns: ['id']
          },
        ]
      }
      user_flags: {
        Row: {
          created_at: string
          detail: string | null
          id: string
          reason: Database['public']['Enums']['flag_reason_enum']
          resolved_at: string | null
          resolved_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          detail?: string | null
          id?: string
          reason: Database['public']['Enums']['flag_reason_enum']
          resolved_at?: string | null
          resolved_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          detail?: string | null
          id?: string
          reason?: Database['public']['Enums']['flag_reason_enum']
          resolved_at?: string | null
          resolved_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_flags_resolved_by_fkey'
            columns: ['resolved_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_flags_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
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
      [_ in never]: never
    }
    Functions: {
      can_update_profile: { Args: { profile_id: string }; Returns: boolean }
      can_view_profile: { Args: { profile_id: string }; Returns: boolean }
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
      detect_review_ring: {
        Args: { p_depth?: number; p_user_id: string }
        Returns: boolean
      }
      diagnose_profile_access: {
        Args: { user_id: string }
        Returns: {
          auth_uid: string
          can_select: boolean
          error_message: string
          profile_exists: boolean
          target_id: string
        }[]
      }
      generate_booking_qr_code: { Args: never; Returns: string }
      get_public_profiles: {
        Args: { p_user_ids: string[] }
        Returns: {
          avatar_url: string
          bio: string
          completed_services: number
          created_at: string
          firstname: string
          id: string
          kyc_status: Database['public']['Enums']['kyc_status']
          lastname: string
          rating: number
        }[]
      }
      get_user_conversations: {
        Args: { p_user_id: string }
        Returns: {
          booking_id: string
          last_message_content: string
          last_message_created_at: string
          other_user_avatar_url: string
          other_user_firstname: string
          other_user_id: string
          other_user_lastname: string
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
      increment_dispute_count: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      owns_announcement: {
        Args: { announcement_id_param: string }
        Returns: boolean
      }
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
          arrival_date: string
          created_at: string
          departure_date: string
          description: string
          destination_city: string
          destination_country: string
          id: string
          match_score: number
          max_weight_kg: number
          origin_city: string
          origin_country: string
          price_per_kg: number
          status: string
          traveler_avatar_url: string
          traveler_first_name: string
          traveler_id: string
          traveler_last_name: string
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
        | 'matched'
        | 'confirmed'
        | 'handed'
        | 'completed'
        | 'payment_pending'
      dispute_status_enum:
        | 'none'
        | 'open'
        | 'won_by_sender'
        | 'won_by_traveler'
        | 'resolved'
      document_type: 'passport' | 'national_id' | 'driving_license'
      flag_reason_enum:
        | 'concentration_ratio'
        | 'duration_too_short'
        | 'ring_collusion'
        | 'manual'
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
        | 'delivery_confirmed'
      payment_status_enum:
        | 'requires_payment_method'
        | 'requires_confirmation'
        | 'succeeded'
        | 'refunded'
        | 'partially_refunded'
      photo_type_enum: 'handoff' | 'delivery'
      review_status_enum: 'pending' | 'submitted' | 'published' | 'skipped'
      subscription_status_enum:
        | 'trialing'
        | 'active'
        | 'past_due'
        | 'canceled'
        | 'inactive'
      transaction_status_enum: 'pending' | 'completed' | 'failed' | 'refunded'
      transaction_type:
        | 'payment'
        | 'commission'
        | 'insurance'
        | 'payout'
        | 'refund'
      transfer_status_enum: 'pending' | 'paid' | 'failed' | 'reversed'
      user_role: 'user' | 'partner' | 'admin'
      verification_status_enum: 'none' | 'pending' | 'verified' | 'rejected'
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
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          metadata: Json | null
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
          metadata?: Json | null
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
          metadata?: Json | null
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
      allow_any_operation: {
        Args: { expected_operations: string[] }
        Returns: boolean
      }
      allow_only_operation: {
        Args: { expected_operation: string }
        Returns: boolean
      }
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      delete_leaf_prefixes: {
        Args: { bucket_ids: string[]; names: string[] }
        Returns: undefined
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string }
        Returns: string
      }
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
          _bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          sort_order?: string
          start_after?: string
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
      search_by_timestamp: {
        Args: {
          p_bucket_id: string
          p_level: number
          p_limit: number
          p_prefix: string
          p_sort_column: string
          p_sort_column_after: string
          p_sort_order: string
          p_start_after: string
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
        'matched',
        'confirmed',
        'handed',
        'completed',
        'payment_pending',
      ],
      dispute_status_enum: [
        'none',
        'open',
        'won_by_sender',
        'won_by_traveler',
        'resolved',
      ],
      document_type: ['passport', 'national_id', 'driving_license'],
      flag_reason_enum: [
        'concentration_ratio',
        'duration_too_short',
        'ring_collusion',
        'manual',
      ],
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
        'delivery_confirmed',
      ],
      payment_status_enum: [
        'requires_payment_method',
        'requires_confirmation',
        'succeeded',
        'refunded',
        'partially_refunded',
      ],
      photo_type_enum: ['handoff', 'delivery'],
      review_status_enum: ['pending', 'submitted', 'published', 'skipped'],
      subscription_status_enum: [
        'trialing',
        'active',
        'past_due',
        'canceled',
        'inactive',
      ],
      transaction_status_enum: ['pending', 'completed', 'failed', 'refunded'],
      transaction_type: [
        'payment',
        'commission',
        'insurance',
        'payout',
        'refund',
      ],
      transfer_status_enum: ['pending', 'paid', 'failed', 'reversed'],
      user_role: ['user', 'partner', 'admin'],
      verification_status_enum: ['none', 'pending', 'verified', 'rejected'],
    },
  },
  storage: {
    Enums: {
      buckettype: ['STANDARD', 'ANALYTICS', 'VECTOR'],
    },
  },
} as const

export type Profile = Tables<'profiles'>
export type Announcement = Tables<'announcements'>
export type Booking = Tables<'bookings'>
export type Message = Tables<'messages'>
export type Notification = Tables<'notifications'>
export type Rating = Tables<'ratings'>
export type Transaction = Tables<'transactions'>
