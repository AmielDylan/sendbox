export type V1CancellationStatus =
  | 'pending'
  | 'accepted'
  | 'confirmed'
  | 'paid'
  | 'deposited'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'disputed'
  | 'refused'

export type BookingActorRole = 'sender' | 'traveler' | 'admin' | 'unknown'

export type CancellationOutcome =
  | 'free_cancellation'
  | 'sender_blocked_after_unlock'
  | 'traveler_credit_review'
  | 'open_dispute'
  | 'already_closed'
  | 'traveler_refusal'

export interface CancellationPolicyInput {
  status: string | null | undefined
  paidAt?: string | null
  actorRole?: BookingActorRole
  cancelledByRole?: BookingActorRole
}

export interface CancellationPolicy {
  outcome: CancellationOutcome
  title: string
  userNotice: string
  adminLabel: string
  adminDescription: string
  canCancel: boolean
  requiresAdminReview: boolean
  reputationPenalty: boolean
  recommendedAction: 'cancel' | 'refund_or_credit' | 'dispute' | 'none'
}

const CLOSED_STATUSES = new Set(['cancelled', 'disputed', 'refused'])
const AFTER_HANDOFF_STATUSES = new Set(['deposited', 'in_transit', 'delivered'])

export function isMatchingUnlocked(
  status: string | null | undefined,
  paidAt?: string | null
) {
  return status === 'confirmed' || status === 'paid' || Boolean(paidAt)
}

export function getCancellationPolicy(
  input: CancellationPolicyInput
): CancellationPolicy {
  const status = input.status ?? 'unknown'
  const actorRole = input.actorRole ?? 'unknown'
  const cancelledByRole = input.cancelledByRole ?? actorRole
  const matchingUnlocked = isMatchingUnlocked(status, input.paidAt)

  if (status === 'pending') {
    return {
      outcome: 'traveler_refusal',
      title: 'Demande en attente',
      userNotice:
        "Le voyageur peut refuser la demande. L'expéditeur n'a pas encore payé de frais Sendbox.",
      adminLabel: 'Pas de remboursement',
      adminDescription:
        'Demande non acceptée : aucun frais Sendbox ne doit être traité.',
      canCancel: false,
      requiresAdminReview: false,
      reputationPenalty: false,
      recommendedAction: 'none',
    }
  }

  if (status === 'accepted' && !matchingUnlocked) {
    return {
      outcome: 'free_cancellation',
      title: 'Annulation sans frais Sendbox',
      userNotice:
        "La mise en relation n'est pas encore payée. L'annulation est possible sans remboursement à traiter.",
      adminLabel: 'Aucun frais prélevé',
      adminDescription:
        'Annulation avant paiement : aucun remboursement ni crédit Sendbox à déclencher.',
      canCancel: actorRole === 'sender' || actorRole === 'traveler',
      requiresAdminReview: false,
      reputationPenalty: false,
      recommendedAction: 'cancel',
    }
  }

  if (CLOSED_STATUSES.has(status)) {
    const travelerCancelledAfterPayment =
      status === 'cancelled' &&
      matchingUnlocked &&
      cancelledByRole === 'traveler'

    return {
      outcome: travelerCancelledAfterPayment
        ? 'traveler_credit_review'
        : 'already_closed',
      title: 'Dossier clôturé',
      userNotice:
        'Cette mise en relation est déjà clôturée. Consultez le motif enregistré ou contactez le support si nécessaire.',
      adminLabel: travelerCancelledAfterPayment
        ? 'À revoir : crédit/remboursement'
        : 'Clôturé',
      adminDescription: travelerCancelledAfterPayment
        ? "Annulation voyageur après paiement : vérifier si l'expéditeur doit recevoir un crédit ou remboursement Sendbox."
        : 'Dossier déjà clôturé : aucune action automatique.',
      canCancel: false,
      requiresAdminReview: travelerCancelledAfterPayment,
      reputationPenalty: travelerCancelledAfterPayment,
      recommendedAction: travelerCancelledAfterPayment
        ? 'refund_or_credit'
        : 'none',
    }
  }

  if (AFTER_HANDOFF_STATUSES.has(status)) {
    return {
      outcome: 'open_dispute',
      title: 'Après remise du colis',
      userNotice:
        "Après la remise, l'annulation automatique n'est plus adaptée. Il faut ouvrir un litige avec les preuves disponibles.",
      adminLabel: 'Litige conseillé',
      adminDescription:
        'Colis remis ou en cours : traiter via litige plutôt que remboursement automatique.',
      canCancel: false,
      requiresAdminReview: true,
      reputationPenalty: false,
      recommendedAction: 'dispute',
    }
  }

  if (matchingUnlocked && actorRole === 'traveler') {
    return {
      outcome: 'traveler_credit_review',
      title: 'Annulation après mise en relation',
      userNotice:
        "Les coordonnées ont été déverrouillées. L'expéditeur peut être éligible à un remboursement ou crédit Sendbox selon le contexte, et un malus de réputation peut s'appliquer au voyageur.",
      adminLabel: 'À revoir : crédit/remboursement',
      adminDescription:
        "Voyageur annulant après paiement : vérifier le contexte et décider d'un crédit ou remboursement Sendbox pour l'expéditeur.",
      canCancel: true,
      requiresAdminReview: true,
      reputationPenalty: true,
      recommendedAction: 'refund_or_credit',
    }
  }

  if (matchingUnlocked && actorRole === 'sender') {
    return {
      outcome: 'sender_blocked_after_unlock',
      title: 'Mise en relation déjà confirmée',
      userNotice:
        "Les coordonnées ont été déverrouillées. L'expéditeur ne peut pas annuler automatiquement : il faut ouvrir un litige ou contacter le support si un imprévu survient.",
      adminLabel: 'Pas automatique',
      adminDescription:
        'Annulation expéditeur après paiement : ne pas rembourser automatiquement, analyser le dossier.',
      canCancel: false,
      requiresAdminReview: true,
      reputationPenalty: false,
      recommendedAction: 'dispute',
    }
  }

  return {
    outcome: 'open_dispute',
    title: 'Cas à analyser',
    userNotice:
      "Ce cas ne doit pas être traité automatiquement. Ouvrez un litige ou contactez le support pour qu'un admin analyse la situation.",
    adminLabel: 'Analyse admin',
    adminDescription:
      'Statut non couvert par une règle automatique V1 : analyser le dossier.',
    canCancel: false,
    requiresAdminReview: true,
    reputationPenalty: false,
    recommendedAction: 'dispute',
  }
}
