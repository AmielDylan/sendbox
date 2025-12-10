/**
 * Types de base de données Supabase
 *
 * Ce fichier réexporte les types générés depuis Supabase pour une utilisation simplifiée.
 *
 * Pour régénérer les types :
 * supabase gen types typescript --linked > types/supabase.ts
 */

import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
} from './supabase'

export type { Database, Tables, TablesInsert, TablesUpdate, Enums }

// Types de tables simplifiés pour utilisation courante
export type Profile = Tables<'profiles'>
export type ProfileInsert = TablesInsert<'profiles'>
export type ProfileUpdate = TablesUpdate<'profiles'>

export type Announcement = Tables<'announcements'>
export type AnnouncementInsert = TablesInsert<'announcements'>
export type AnnouncementUpdate = TablesUpdate<'announcements'>

export type Booking = Tables<'bookings'>
export type BookingInsert = TablesInsert<'bookings'>
export type BookingUpdate = TablesUpdate<'bookings'>

export type Message = Tables<'messages'>
export type MessageInsert = TablesInsert<'messages'>
export type MessageUpdate = TablesUpdate<'messages'>

export type Notification = Tables<'notifications'>
export type NotificationInsert = TablesInsert<'notifications'>
export type NotificationUpdate = TablesUpdate<'notifications'>

export type Rating = Tables<'ratings'>
export type RatingInsert = TablesInsert<'ratings'>
export type RatingUpdate = TablesUpdate<'ratings'>

export type Transaction = Tables<'transactions'>
export type TransactionInsert = TablesInsert<'transactions'>
export type TransactionUpdate = TablesUpdate<'transactions'>
