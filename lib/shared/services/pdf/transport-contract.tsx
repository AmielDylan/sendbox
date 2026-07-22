/**
 * Template PDF : Contrat de transport
 */

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { getCountryName } from '@/lib/utils/countries'

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

        {/* Accord financier */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCORD FINANCIER</Text>
          <Text style={styles.text}>
            Prix transport indiqué : {booking.total_price || 0} EUR
          </Text>
          <Text style={styles.text}>
            Frais Sendbox : réglés séparément lors de la confirmation de mise en
            relation
          </Text>
          <Text style={styles.total}>
            Montant transport convenu : {booking.total_price || 0} EUR
          </Text>
        </View>

        {/* Conditions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CONDITIONS</Text>
          <Text style={styles.small}>
            - Le voyageur s'engage à transporter le colis avec soin{'\n'}-
            L'expéditeur garantit la conformité du contenu déclaré{'\n'}- Le
            transport se règle directement entre l'expéditeur et le voyageur,
            hors plateforme{'\n'}- Sendbox ne conserve pas les fonds du
            transport{'\n'}- En cas de litige, contacter contact@gosendbox.com
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
