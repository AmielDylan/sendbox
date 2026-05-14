const sections = [
  {
    title: '1. Nature du service',
    body: [
      "Sendbox est une plateforme de mise en relation entre expéditeurs et voyageurs. Sendbox n'est pas un transporteur, un intermédiaire de paiement, ni un prestataire logistique.",
      'Sendbox fournit exclusivement un service de mise en relation et de gestion de réputation entre utilisateurs.',
    ],
  },
  {
    title: '2. Frais de mise en relation',
    body: [
      "L'expéditeur règle des frais de mise en relation de 1,50 € au moment de la confirmation mutuelle. Ces frais rémunèrent le service fourni par Sendbox et ne constituent pas un paiement pour le transport du colis.",
      'Ces frais sont non remboursables une fois la mise en relation confirmée.',
    ],
  },
  {
    title: '3. Paiements entre utilisateurs',
    body: [
      "Le paiement du service de transport entre expéditeur et voyageur est réalisé directement entre les parties, hors plateforme. Sendbox n'est pas partie à cet accord et ne peut être tenu responsable de tout litige financier entre utilisateurs.",
    ],
  },
  {
    title: '4. Contenu des colis',
    body: [
      "Sont strictement interdits : stupéfiants, armes, contrefaçons, espèces, documents falsifiés, matières dangereuses et produits soumis à des restrictions douanières sans déclaration.",
      "Toute infraction engage la responsabilité exclusive de l'expéditeur. Le voyageur est en droit de refuser tout colis suspect.",
    ],
  },
  {
    title: '5. Responsabilités',
    body: [
      "Sendbox n'est pas responsable de la perte, de l'endommagement d'un colis, du non-paiement entre utilisateurs, ni des dommages causés par le contenu d'un colis.",
      "L'expéditeur est responsable de la conformité douanière et légale du contenu, de l'exactitude des informations fournies, et du paiement convenu avec le voyageur.",
      'Le voyageur est responsable du transport en toute légalité, de la remise au destinataire désigné, et de la vérification raisonnable du contenu avant acceptation.',
    ],
  },
  {
    title: '6. Litiges entre utilisateurs',
    body: [
      "En cas de litige, Sendbox peut suspendre les comptes impliqués pendant l'instruction, rendre le litige visible sur les profils publics des parties, fournir l'historique de transaction comme élément de preuve et prononcer une suspension ou un bannissement définitif.",
      'Sendbox ne peut imposer aucun remboursement ni ordonner un paiement entre utilisateurs. Les recours financiers relèvent des parties et des juridictions compétentes.',
    ],
  },
  {
    title: "7. Vérification d'identité",
    body: [
      "L'utilisation de Sendbox requiert une vérification d'identité. Toute tentative de contournement entraîne un bannissement définitif et peut faire l'objet d'un signalement aux autorités.",
    ],
  },
  {
    title: '8. Données personnelles',
    body: [
      "Les données sont traitées conformément au RGPD. Les photos sont conservées 12 mois après la transaction. L'historique des transactions est conservé 5 ans.",
    ],
  },
  {
    title: '9. Juridiction',
    body: [
      'Les présentes CGU sont soumises au droit français. Tout litige relatif à Sendbox relève de la compétence des tribunaux de Paris.',
    ],
  },
]

export default function CGUPage() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-12 sm:px-6">
      <header className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Dernière mise à jour : 15 mai 2026
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Conditions générales d&apos;utilisation
        </h1>
      </header>

      <div className="flex flex-col gap-8">
        {sections.map(section => (
          <section key={section.title} className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold">{section.title}</h2>
            {section.body.map(paragraph => (
              <p
                key={paragraph}
                className="text-sm leading-7 text-muted-foreground sm:text-base"
              >
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
    </main>
  )
}
