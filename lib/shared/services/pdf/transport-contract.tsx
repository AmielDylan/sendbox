/**
 * Template PDF : Contrat de transport
 */

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { getCountryName } from '@/lib/utils/countries'
import { MAX_INSURANCE_COVERAGE } from '@/lib/core/bookings/validations'

interface BookingWithRelations {
  id: string
  qr_code: string
  weight_kg: number | null
  kilos_requested: string | null
  package_value: number | null
  description: string | null
  package_description: string | null
  total_price: number | null
  commission_amount: number | null
  insurance_opted: boolean | null
  insurance_premium: number | null
  paid_at: string | null
  qrCodeDataURL?: string
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

interface TransportContractProps {
  booking: BookingWithRelations
}

export function TransportContract({ booking }: TransportContractProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const getDisplayName = (
    person: { firstname: string | null; lastname: string | null } | null,
    fallback: string
  ) => {
    const name = `${person?.firstname ?? ''} ${person?.lastname ?? ''}`.trim()
    if (name) return name
    return fallback
  }

  const senderName = getDisplayName(booking.sender, 'Expéditeur')
  const travelerName = getDisplayName(booking.traveler, 'Voyageur')

  const totalAmount =
    (booking.total_price || 0) +
    (booking.commission_amount || 0) +
    (booking.insurance_opted ? booking.insurance_premium || 0 : 0)

  const insuranceCoverage = booking.insurance_opted
    ? Math.min(booking.package_value || 0, MAX_INSURANCE_COVERAGE)
    : 0

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>CONTRAT DE TRANSPORT</Text>
          <Text style={styles.subtitle}>N° {booking.qr_code}</Text>
        </View>

        {/* Parties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ENTRE LES PARTIES</Text>

          <Text style={styles.label}>L'EXPÉDITEUR :</Text>
          <Text style={styles.text}>{senderName}</Text>
          <View style={styles.spacer} />

          <Text style={styles.label}>LE VOYAGEUR :</Text>
          <Text style={styles.text}>{travelerName}</Text>
        </View>

        {/* Trajet */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DÉTAILS DU TRAJET</Text>
          <Text style={styles.text}>
            Départ : {booking.announcement.departure_city},{' '}
            {getCountryName(booking.announcement.departure_country)}
          </Text>
          <Text style={styles.text}>
            Date : {formatDate(booking.announcement.departure_date)}
          </Text>
          <Text style={styles.text}>
            Arrivée : {booking.announcement.arrival_city},{' '}
            {getCountryName(booking.announcement.arrival_country)}
          </Text>
          <Text style={styles.text}>
            Date : {formatDate(booking.announcement.arrival_date)}
          </Text>
        </View>

        {/* Colis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DESCRIPTION DU COLIS</Text>
          <Text style={styles.text}>
            Poids : {booking.weight_kg || booking.kilos_requested || 0} kg
          </Text>
          <Text style={styles.text}>
            Valeur déclarée : {booking.package_value || 0} EUR
          </Text>
          {(booking.description || booking.package_description) && (
            <Text style={styles.text}>
              Description : {booking.description || booking.package_description}
            </Text>
          )}
        </View>

        {/* Tarification */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TARIFICATION</Text>
          <Text style={styles.text}>
            Prix transport : {booking.total_price || 0} EUR
          </Text>
          <Text style={styles.text}>
            Commission Sendbox : {booking.commission_amount || 0} EUR
          </Text>
          {booking.insurance_opted && (
            <>
              <Text style={styles.text}>
                Protection du colis : {booking.insurance_premium || 0} EUR
              </Text>
              <Text style={styles.text}>Plafond : {insuranceCoverage} EUR</Text>
            </>
          )}
          <Text style={styles.total}>
            TOTAL PAYÉ : {totalAmount.toFixed(2)} EUR
          </Text>
        </View>

        {/* Conditions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CONDITIONS</Text>
          <Text style={styles.small}>
            - Le voyageur s'engage à transporter le colis avec soin{'\n'}-
            L'expéditeur garantit la conformité du contenu{'\n'}- Le paiement
            est bloqué jusqu'à livraison confirmée{'\n'}- En cas de litige,
            contacter support@sendbox.io
          </Text>
        </View>

        {/* QR Code */}
        {booking.qrCodeDataURL && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CODE DE SUIVI</Text>
            <View style={styles.qrContainer}>
              <Text style={styles.qrText}>{booking.qr_code}</Text>
            </View>
          </View>
        )}

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
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 5,
    marginBottom: 3,
  },
  text: {
    fontSize: 10,
    marginBottom: 3,
    lineHeight: 1.4,
  },
  spacer: {
    height: 10,
  },
  total: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#0d5554',
  },
  small: {
    fontSize: 9,
    lineHeight: 1.4,
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
