/**
 * Queries pour récupérer les détails d'une annonce
 */

import { createClient } from '@/lib/supabase/client'

export interface AnnouncementDetail {
  id: string
  traveler_id: string
  origin_country: string
  origin_city: string
  destination_country: string
  destination_city: string
  departure_date: string
  max_weight_kg: number
  price_per_kg: number
  description: string | null
  status: string
  created_at: string
  updated_at: string
  views_count?: number
  traveler_first_name: string | null
  traveler_last_name: string | null
  traveler_avatar_url: string | null
  traveler_rating: number
  traveler_services_count: number
  traveler_member_since: string | null
  traveler_kyc_status: 'pending' | 'approved' | 'rejected' | null
  reserved_weight: number
}

export interface Review {
  id: string
  rater_first_name: string | null
  rater_last_name: string | null
  rater_avatar_url: string | null
  rating: number
  comment: string | null
  created_at: string
}

/**
 * Récupère les détails complets d'une annonce
 */
export async function getAnnouncementDetail(
  announcementId: string
): Promise<{ data: AnnouncementDetail | null; error: any }> {
  const supabase = createClient()

  // Récupérer l'annonce avec les infos du voyageur
  const { data: announcement, error: announcementError } = await supabase
    .from('announcements')
    .select(
      `
      *,
      profiles:traveler_id (
        first_name,
        last_name,
        avatar_url,
        kyc_status,
        created_at
      )
    `
    )
    .eq('id', announcementId)
    .single()

  if (announcementError || !announcement) {
    return { data: null, error: announcementError }
  }

  // Calculer le poids réservé (somme des bookings confirmés)
  const { data: bookings } = await supabase
    .from('bookings')
    .select('weight_kg')
    .eq('announcement_id', announcementId)
    .in('status', ['confirmed', 'in_transit'])

  const reservedWeight =
    bookings?.reduce((sum, booking) => sum + (booking.weight_kg || 0), 0) || 0

  // Calculer le rating et le nombre de services du voyageur
  const { data: ratings } = await supabase
    .from('ratings')
    .select('rating')
    .eq('rated_user_id', announcement.traveler_id)

  const travelerRating =
    ratings && ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0

  const { count: servicesCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('announcement_id', announcementId)
    .eq('status', 'delivered')

  const profile = announcement.profiles as any
  const announcementData = announcement as any

  return {
    data: {
      id: announcement.id,
      traveler_id: announcement.traveler_id,
      origin_country: announcement.origin_country,
      origin_city: announcement.origin_city,
      destination_country: announcement.destination_country,
      destination_city: announcement.destination_city,
      departure_date: announcement.departure_date,
      max_weight_kg: announcement.max_weight_kg,
      price_per_kg: announcement.price_per_kg,
      description: announcement.description,
      status: announcement.status,
      created_at: announcement.created_at,
      updated_at: announcement.updated_at,
      traveler_first_name: profile?.first_name || null,
      traveler_last_name: profile?.last_name || null,
      traveler_avatar_url: profile?.avatar_url || null,
      traveler_rating: travelerRating,
      traveler_services_count: servicesCount || 0,
      traveler_member_since: profile?.created_at || null,
      traveler_kyc_status: profile?.kyc_status || null,
      reserved_weight: reservedWeight,
      views_count: announcementData.views_count || 0,
    },
    error: null,
  }
}

/**
 * Récupère les avis pour un voyageur
 */
export async function getTravelerReviews(
  travelerId: string,
  limit: number = 10
): Promise<{ data: Review[] | null; error: any }> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('ratings')
    .select(
      `
      id,
      rating,
      comment,
      created_at,
      rater:rater_id (
        first_name,
        last_name,
        avatar_url
      )
    `
    )
    .eq('rated_user_id', travelerId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    return { data: null, error }
  }

  const reviews: Review[] =
    data?.map((rating: any) => ({
      id: rating.id,
      rater_first_name: rating.rater?.first_name || null,
      rater_last_name: rating.rater?.last_name || null,
      rater_avatar_url: rating.rater?.avatar_url || null,
      rating: rating.rating,
      comment: rating.comment,
      created_at: rating.created_at,
    })) || []

  return { data: reviews, error: null }
}

