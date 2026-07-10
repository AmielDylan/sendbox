export type DisputeReasonCode =
  | 'traveler_no_show'
  | 'sender_no_show'
  | 'package_not_handed_over'
  | 'package_damaged'
  | 'package_lost'
  | 'content_mismatch'
  | 'delivery_not_confirmed'
  | 'other'

export interface DisputeReason {
  code: DisputeReasonCode
  label: string
  description: string
  evidenceChecklist: string[]
}

export const DISPUTE_REASONS: DisputeReason[] = [
  {
    code: 'traveler_no_show',
    label: 'Voyageur absent au rendez-vous',
    description:
      "Le voyageur n'est pas venu au rendez-vous prévu ou n'a pas prévenu à temps.",
    evidenceChecklist: [
      'Date, heure et lieu du rendez-vous',
      'Capture des échanges ou tentative de contact',
      'Nouvelle date proposée, si applicable',
    ],
  },
  {
    code: 'sender_no_show',
    label: 'Expéditeur absent au rendez-vous',
    description:
      "L'expéditeur n'est pas venu au rendez-vous prévu ou n'a pas remis le colis.",
    evidenceChecklist: [
      'Date, heure et lieu du rendez-vous',
      'Capture des échanges ou tentative de contact',
      'Temps d’attente ou impact sur le voyage',
    ],
  },
  {
    code: 'package_not_handed_over',
    label: 'Colis non remis',
    description:
      "Le colis n'a pas été remis alors que la mise en relation était confirmée.",
    evidenceChecklist: [
      'Statut actuel du colis',
      'Preuve du rendez-vous prévu',
      'Dernier message reçu de l’autre partie',
    ],
  },
  {
    code: 'package_damaged',
    label: 'Colis endommagé à la livraison',
    description:
      'Le colis est arrivé endommagé ou son emballage paraît ouvert ou détérioré.',
    evidenceChecklist: [
      'Photos nettes du colis à la réception',
      'Photos de remise ou de départ, si disponibles',
      'Description précise des dommages constatés',
    ],
  },
  {
    code: 'package_lost',
    label: 'Colis perdu',
    description:
      "Le colis n'est plus localisable ou n'a pas été livré malgré la prise en charge.",
    evidenceChecklist: [
      'Date de remise du colis',
      'Dernier statut connu',
      'Échanges récents avec l’autre partie',
    ],
  },
  {
    code: 'content_mismatch',
    label: 'Contenu non conforme à la déclaration',
    description:
      'Le contenu constaté ne correspond pas à la déclaration faite avant acceptation.',
    evidenceChecklist: [
      'Déclaration colis initiale',
      'Photos ou preuves du contenu constaté',
      'Moment où la non-conformité a été découverte',
    ],
  },
  {
    code: 'delivery_not_confirmed',
    label: 'Livraison non confirmée',
    description:
      "Le colis est marqué livré ou remis, mais la réception n'est pas confirmée.",
    evidenceChecklist: [
      'Preuve de livraison ou de remise',
      'Identité de la personne ayant reçu le colis',
      'Échanges après la livraison',
    ],
  },
  {
    code: 'other',
    label: 'Autre situation',
    description:
      'La situation ne correspond pas aux motifs standards et nécessite une analyse.',
    evidenceChecklist: [
      'Chronologie des faits',
      'Captures ou photos utiles',
      'Action attendue de Sendbox',
    ],
  },
]

export function getDisputeReason(codeOrLabel: string | null | undefined) {
  if (!codeOrLabel) return null
  return (
    DISPUTE_REASONS.find(
      reason => reason.code === codeOrLabel || reason.label === codeOrLabel
    ) ?? null
  )
}

export function formatDisputeReason(codeOrLabel: string) {
  return getDisputeReason(codeOrLabel)?.label ?? codeOrLabel
}

export function getDisputeEvidenceChecklist(codeOrLabel: string) {
  return (
    getDisputeReason(codeOrLabel)?.evidenceChecklist ??
    DISPUTE_REASONS.find(reason => reason.code === 'other')!.evidenceChecklist
  )
}

export function isDisputableBookingStatus(status: string | null | undefined) {
  if (!status) return false
  return [
    'accepted',
    'confirmed',
    'paid',
    'deposited',
    'handed',
    'in_transit',
    'delivered',
    'completed',
    'ACCEPTED',
    'CONFIRMED',
    'PAID',
    'DEPOSITED',
    'HANDED',
    'IN_TRANSIT',
    'DELIVERED',
    'COMPLETED',
  ].includes(status)
}
