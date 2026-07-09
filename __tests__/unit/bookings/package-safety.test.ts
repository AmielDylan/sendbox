import { describe, expect, it } from 'vitest'
import {
  buildPackageRefusalReason,
  buildSafePackageDescription,
} from '@/lib/core/bookings/package-safety'

describe('package safety helpers', () => {
  it('construit une declaration colis lisible', () => {
    const description = buildSafePackageDescription({
      category: 'electronics',
      dimensions: '30 x 20 x 10 cm',
      description: '  Telephone dans sa boite  ',
    })

    expect(description).toContain('Categorie: Electronique')
    expect(description).toContain('Dimensions approx.: 30 x 20 x 10 cm')
    expect(description).toContain('Contenu declare: Telephone dans sa boite')
    expect(description).toContain('Attestation expediteur')
  })

  it('retourne le libelle du motif de refus structure', () => {
    expect(
      buildPackageRefusalReason({ reason: 'forbidden_or_risky_item' })
    ).toBe('Objet interdit ou a risque')
  })

  it('ajoute les precisions quand elles sont fournies', () => {
    expect(
      buildPackageRefusalReason({
        reason: 'unclear_content',
        details: 'description trop vague',
      })
    ).toBe('Contenu trop flou - description trop vague')
  })

  it('utilise le texte libre pour le motif autre', () => {
    expect(
      buildPackageRefusalReason({
        reason: 'other',
        details: 'Je prefere verifier ce colis avec le support',
      })
    ).toBe('Je prefere verifier ce colis avec le support')
  })
})
