export type BookingReportReasonCode =
  | 'traveler_unresponsive'
  | 'sender_unresponsive'
  | 'travel_cancelled'
  | 'travel_postponed'
  | 'package_mismatch'
  | 'handoff_impossible'
  | 'delivery_not_confirmed'
  | 'other'

export interface BookingReportReason {
  code: BookingReportReasonCode
  label: string
  description: string
}

export const BOOKING_REPORT_REASONS: BookingReportReason[] = [
  {
    code: 'traveler_unresponsive',
    label: 'Le voyageur ne repond plus',
    description:
      'Le voyageur ne donne plus de nouvelles alors que la reservation avance.',
  },
  {
    code: 'sender_unresponsive',
    label: "L'expediteur ne repond plus",
    description:
      "L'expediteur ne donne plus de nouvelles pour organiser la remise.",
  },
  {
    code: 'travel_cancelled',
    label: 'Voyage annule',
    description:
      'Le voyage prevu ne peut plus avoir lieu dans les conditions annoncees.',
  },
  {
    code: 'travel_postponed',
    label: 'Voyage reporte',
    description:
      'Le voyage reste possible, mais une nouvelle date doit etre proposee.',
  },
  {
    code: 'package_mismatch',
    label: 'Colis non conforme',
    description:
      'Le colis constate ne correspond pas a la declaration initiale.',
  },
  {
    code: 'handoff_impossible',
    label: 'Remise du colis impossible',
    description: 'La remise ne peut pas se faire au moment ou au lieu convenu.',
  },
  {
    code: 'delivery_not_confirmed',
    label: 'Livraison non confirmee',
    description:
      "Le colis est indique livre, mais la reception n'est pas encore confirmee.",
  },
  {
    code: 'other',
    label: 'Autre probleme',
    description: 'La situation necessite une lecture manuelle par Sendbox.',
  },
]

export function getBookingReportReason(codeOrLabel: string | null | undefined) {
  if (!codeOrLabel) return null
  return (
    BOOKING_REPORT_REASONS.find(
      reason => reason.code === codeOrLabel || reason.label === codeOrLabel
    ) ?? null
  )
}

export function formatBookingReportReason(codeOrLabel: string) {
  return getBookingReportReason(codeOrLabel)?.label ?? codeOrLabel
}

export function isBookingReportReason(
  value: string
): value is BookingReportReasonCode {
  return BOOKING_REPORT_REASONS.some(reason => reason.code === value)
}

export const REPORTABLE_BOOKING_STATUSES = [
  'accepted',
  'confirmed',
  'paid',
  'deposited',
  'handed',
  'in_transit',
  'delivered',
] as const

export const OPEN_BOOKING_REPORT_STATUSES = ['open', 'reviewing'] as const

export function isReportableBookingStatus(status: string | null | undefined) {
  if (!status) return false
  return (REPORTABLE_BOOKING_STATUSES as readonly string[]).includes(
    status.toLowerCase()
  )
}

export function isOpenBookingReportStatus(status: string | null | undefined) {
  if (!status) return false
  return (OPEN_BOOKING_REPORT_STATUSES as readonly string[]).includes(
    status.toLowerCase()
  )
}

export function normalizeBookingReportMessage(message: string) {
  return message.trim().replace(/\s+/g, ' ')
}
