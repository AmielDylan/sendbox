/**
 * Server Actions pour la génération de PDF
 */

'use server'

import { createClient } from "@/lib/shared/db/server"
import { pdf } from '@react-pdf/renderer'
import { TransportContract } from '@/lib/shared/services/pdf/transport-contract'
import { DepositProof } from '@/lib/shared/services/pdf/deposit-proof'
import { DeliveryProof } from '@/lib/shared/services/pdf/delivery-proof'
import QRCode from 'qrcode'
import React from 'react'

/**
 * Génère le contrat de transport PDF
 */
export async function generateTransportContract(bookingId: string) {
  const supabase = await createClient()

  try {
    // Récupérer les données du booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(
        `
        *,
        sender:sender_id (
          firstname,
          lastname
        ),
        traveler:traveler_id (
          firstname,
          lastname
        ),
        announcements:announcement_id (
          departure_city,
          departure_country,
          arrival_city,
          arrival_country,
          departure_date,
          arrival_date
        )
      `
      )
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return {
        error: 'Réservation introuvable',
      }
    }

    if (!booking.qr_code) {
      return {
        error: 'QR code manquant',
      }
    }

    // Générer QR code en dataURL
    const qrCodeDataURL = await QRCode.toDataURL(booking.qr_code, {
      width: 300,
      margin: 2,
      color: {
        dark: '#0d5554',
        light: '#ffffff',
      },
    })

    const bookingWithQR: any = {
      ...booking,
      qr_code: booking.qr_code || '',
      qrCodeDataURL,
      sender: booking.sender as any,
      traveler: booking.traveler as any,
      announcement: booking.announcements as any,
    }

    // Générer PDF
    const pdfDoc = React.createElement(TransportContract, {
      booking: bookingWithQR,
    })
    // @ts-expect-error - @react-pdf/renderer type issue
    const blob = await pdf(pdfDoc).toBlob()

    // Upload vers Storage
    const fileName = `contract-${booking.qr_code}.pdf`
    const filePath = `${bookingId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('contracts')
      .upload(filePath, blob, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      console.error('Error uploading contract PDF:', uploadError)
      return {
        error: 'Erreur lors de l\'upload du contrat',
      }
    }

    // Générer URL signée (expire 7 jours)
    const { data: urlData, error: urlError } = await supabase.storage
      .from('contracts')
      .createSignedUrl(filePath, 604800) // 7 jours

    if (urlError || !urlData) {
      console.error('Error creating signed URL:', urlError)
      return {
        error: 'Erreur lors de la génération de l\'URL',
      }
    }

    return {
      success: true,
      url: urlData.signedUrl,
      fileName,
    }
  } catch (error) {
    console.error('Error generating transport contract:', error)
    return {
      error: 'Une erreur est survenue lors de la génération du contrat',
    }
  }
}

/**
 * Génère la preuve de dépôt PDF
 */
export async function generateDepositProof(bookingId: string) {
  const supabase = await createClient()

  try {
    // Récupérer les données du booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(
        `
        *,
        sender:sender_id (
          firstname,
          lastname
        ),
        traveler:traveler_id (
          firstname,
          lastname
        ),
        announcements:announcement_id (
          departure_city,
          departure_country,
          arrival_city,
          arrival_country,
          departure_date
        )
      `
      )
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return {
        error: 'Réservation introuvable',
      }
    }

    if (!booking.deposited_at) {
      return {
        error: 'Le colis n\'a pas encore été déposé',
      }
    }

    const bookingWithRelations: any = {
      ...booking,
      qr_code: booking.qr_code || '',
      delivered_at: booking.delivered_at || '',
      sender: booking.sender as any,
      traveler: booking.traveler as any,
      announcement: booking.announcements as any,
    }

    // Générer PDF
    const pdfDoc = React.createElement(DepositProof, {
      booking: bookingWithRelations,
    })
    // @ts-expect-error - @react-pdf/renderer type issue
    const blob = await pdf(pdfDoc).toBlob()

    // Upload vers Storage
    const fileName = `deposit-proof-${booking.qr_code}.pdf`
    const filePath = `${bookingId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('contracts')
      .upload(filePath, blob, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      console.error('Error uploading deposit proof PDF:', uploadError)
      return {
        error: 'Erreur lors de l\'upload de la preuve',
      }
    }

    // Générer URL signée (expire 7 jours)
    const { data: urlData, error: urlError } = await supabase.storage
      .from('contracts')
      .createSignedUrl(filePath, 604800)

    if (urlError || !urlData) {
      return {
        error: 'Erreur lors de la génération de l\'URL',
      }
    }

    return {
      success: true,
      url: urlData.signedUrl,
      fileName,
    }
  } catch (error) {
    console.error('Error generating deposit proof:', error)
    return {
      error: 'Une erreur est survenue lors de la génération de la preuve',
    }
  }
}

/**
 * Génère la preuve de livraison PDF
 */
export async function generateDeliveryProof(bookingId: string) {
  const supabase = await createClient()

  try {
    // Récupérer les données du booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(
        `
        *,
        sender:sender_id (
          firstname,
          lastname
        ),
        traveler:traveler_id (
          firstname,
          lastname
        ),
        announcements:announcement_id (
          departure_city,
          departure_country,
          arrival_city,
          arrival_country,
          departure_date,
          arrival_date
        )
      `
      )
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return {
        error: 'Réservation introuvable',
      }
    }

    if (!booking.delivered_at) {
      return {
        error: 'Le colis n\'a pas encore été livré',
      }
    }

    const bookingWithRelations: any = {
      ...booking,
      qr_code: booking.qr_code || '',
      delivered_at: booking.delivered_at || '',
      sender: booking.sender as any,
      traveler: booking.traveler as any,
      announcement: booking.announcements as any,
    }

    // Générer PDF
    const pdfDoc = React.createElement(DeliveryProof, {
      booking: bookingWithRelations,
    })
    // @ts-expect-error - @react-pdf/renderer type issue
    const blob = await pdf(pdfDoc).toBlob()

    // Upload vers Storage
    const fileName = `delivery-proof-${booking.qr_code}.pdf`
    const filePath = `${bookingId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('contracts')
      .upload(filePath, blob, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      console.error('Error uploading delivery proof PDF:', uploadError)
      return {
        error: 'Erreur lors de l\'upload de la preuve',
      }
    }

    // Générer URL signée (expire 7 jours)
    const { data: urlData, error: urlError } = await supabase.storage
      .from('contracts')
      .createSignedUrl(filePath, 604800)

    if (urlError || !urlData) {
      return {
        error: 'Erreur lors de la génération de l\'URL',
      }
    }

    return {
      success: true,
      url: urlData.signedUrl,
      fileName,
    }
  } catch (error) {
    console.error('Error generating delivery proof:', error)
    return {
      error: 'Une erreur est survenue lors de la génération de la preuve',
    }
  }
}

/**
 * Récupère l'URL d'un contrat PDF
 */
export async function getContractUrl(bookingId: string, type: 'contract' | 'deposit' | 'delivery' = 'contract') {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      error: 'Non authentifié',
    }
  }

  // Récupérer le booking pour obtenir le QR code
  const { data: booking } = await supabase
    .from('bookings')
    .select('qr_code, sender_id, traveler_id')
    .eq('id', bookingId)
    .single()

  if (!booking) {
    return {
      error: 'Réservation introuvable',
    }
  }

  // Vérifier l'accès
  if (booking.sender_id !== user.id && booking.traveler_id !== user.id) {
    return {
      error: 'Non autorisé',
    }
  }

  let fileName: string
  if (type === 'contract') {
    fileName = `contract-${booking.qr_code}.pdf`
  } else if (type === 'deposit') {
    fileName = `deposit-proof-${booking.qr_code}.pdf`
  } else {
    fileName = `delivery-proof-${booking.qr_code}.pdf`
  }

  const filePath = `${bookingId}/${fileName}`

  // Générer URL signée
  const { data: urlData, error } = await supabase.storage
    .from('contracts')
    .createSignedUrl(filePath, 604800)

  if (error || !urlData) {
    return {
      error: 'Document introuvable ou erreur lors de la génération de l\'URL',
    }
  }

  return {
    url: urlData.signedUrl,
  }
}

