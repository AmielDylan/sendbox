/**
 * Template PDF : Preuve de livraison
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image as PdfImage,
} from '@react-pdf/renderer'

interface DeliveryProofProps {
  booking: {
    id: string
    qr_code: string
    weight_kg: number
    delivered_at: string
    delivery_photo_url: string | null
    delivery_signature_url: string | null
    delivery_location_lat: number | null
    delivery_location_lng: number | null
    deposited_at: string | null
    sender: {
      firstname: string | null
      lastname: string | null
    } | null
    traveler: {
      firstname: string | null
      lastname: string | null
    } | null
    announcement: {
      departure_city: string
      departure_country: string
      arrival_city: string
      arrival_country: string
      departure_date: string
      arrival_date: string
    }
  }
}

export function DeliveryProof({ booking }: DeliveryProofProps) {
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getDisplayName = (
    person: { firstname: string | null; lastname: string | null } | null,
    fallback: string
  ) => {
    const name = `${person?.firstname ?? ''} ${person?.lastname ?? ''}`.trim()
    return name || fallback
  }

  const senderName = getDisplayName(booking.sender, 'Expéditeur')
  const travelerName = getDisplayName(booking.traveler, 'Voyageur')

  const calculateDuration = () => {
    if (!booking.deposited_at || !booking.delivered_at) return null
    const deposit = new Date(booking.deposited_at)
    const delivery = new Date(booking.delivered_at)
    const diffMs = delivery.getTime() - deposit.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>PREUVE DE LIVRAISON</Text>
          <Text style={styles.subtitle}>N° {booking.qr_code}</Text>
        </View>

        {/* Informations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INFORMATIONS</Text>
          <Text style={styles.text}>
            Date et heure de livraison : {formatDateTime(booking.delivered_at)}
          </Text>
          {booking.deposited_at && (
            <Text style={styles.text}>
              Date de dépôt : {formatDateTime(booking.deposited_at)}
            </Text>
          )}
          {calculateDuration() !== null && (
            <Text style={styles.text}>
              Durée du transport : {calculateDuration()} jour(s)
            </Text>
          )}
          <Text style={styles.text}>Expéditeur : {senderName}</Text>
          <Text style={styles.text}>Voyageur : {travelerName}</Text>
          <Text style={styles.text}>
            Trajet : {booking.announcement.departure_city} →{' '}
            {booking.announcement.arrival_city}
          </Text>
          <Text style={styles.text}>Poids : {booking.weight_kg} Kg</Text>
          {booking.delivery_location_lat && booking.delivery_location_lng && (
            <Text style={styles.text}>
              Localisation : {booking.delivery_location_lat.toFixed(6)},{' '}
              {booking.delivery_location_lng.toFixed(6)}
            </Text>
          )}
        </View>

        {/* Photo */}
        {booking.delivery_photo_url && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PHOTO DU COLIS REÇU</Text>
            <PdfImage
              src={booking.delivery_photo_url}
              style={styles.image}
              cache={false}
            />
          </View>
        )}

        {/* Signature */}
        {booking.delivery_signature_url && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SIGNATURE DE RÉCEPTION</Text>
            <PdfImage
              src={booking.delivery_signature_url}
              style={styles.signature}
              cache={false}
            />
          </View>
        )}

        {/* QR Code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CODE DE SUIVI</Text>
          <View style={styles.qrContainer}>
            <Text style={styles.qrText}>{booking.qr_code}</Text>
          </View>
        </View>

        {/* Confirmation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CONFIRMATION</Text>
          <Text style={styles.text}>
            Le colis a été livré avec succès et en bon état. Le paiement au
            voyageur sera effectué sous 24-48h.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Document généré le {new Date().toLocaleDateString('fr-FR')}
          </Text>
          <Text style={styles.footerText}>
            Sendbox - Le covalissage en toute confiance
          </Text>
        </View>
      </Page>
    </Document>
  )
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0d5554',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#0d5554',
    textTransform: 'uppercase',
  },
  text: {
    fontSize: 10,
    marginBottom: 3,
    lineHeight: 1.4,
  },
  image: {
    width: '100%',
    maxHeight: 200,
    objectFit: 'contain',
    marginTop: 5,
  },
  signature: {
    width: '100%',
    maxHeight: 100,
    objectFit: 'contain',
    marginTop: 5,
    backgroundColor: '#f5f5f5',
  },
  qrContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  qrText: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Courier',
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#666',
    marginBottom: 3,
  },
})
