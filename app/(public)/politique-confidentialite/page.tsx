export const metadata = {
  title: 'Politique de confidentialité | Sendbox',
}

const sections = [
  {
    title: 'Responsable du traitement',
    content:
      'Les données sont traitées par AMIEL ADJOVI CONSULTING pour exploiter le service Sendbox, accessible sur www.gosendbox.com. Pour toute demande liée à vos données personnelles : legal@gosendbox.com.',
  },
  {
    title: 'Données collectées',
    content:
      "Sendbox traite les données de compte, les informations de profil, les documents de vérification d'identité, les annonces de voyage, les demandes de colis, les déclarations colis, les messages liés aux réservations, les preuves photo, les avis, les notifications, les signalements, les litiges et les données techniques nécessaires au fonctionnement du service.",
  },
  {
    title: 'Finalités',
    content:
      "Ces données servent à créer et sécuriser les comptes, vérifier l'identité, publier ou rechercher des trajets, gérer les demandes de colis, documenter les remises et livraisons, prévenir les abus, instruire les litiges, afficher la réputation, envoyer les notifications utiles et encaisser les frais Sendbox de mise en relation.",
  },
  {
    title: 'Paiement des frais Sendbox',
    content:
      'En V1, Sendbox encaisse uniquement les frais de mise en relation, fixés à 2,90 € et facturés en EUR. Le prix du transport est réglé directement entre utilisateurs, hors plateforme. Sendbox ne stocke pas les données complètes de carte bancaire.',
  },
  {
    title: 'Conservation',
    content:
      "Les documents d'identité sont conservés le temps de la vérification, puis supprimés selon les règles indiquées dans les CGU. Les preuves photo, historiques de transaction, avis et éléments de litige sont conservés pendant les durées nécessaires à la sécurité du service, à la preuve et au traitement des réclamations.",
  },
  {
    title: 'Destinataires',
    content:
      "Les données sont accessibles aux utilisateurs concernés par une mise en relation, à l'équipe Sendbox lorsque c'est nécessaire, et aux prestataires techniques utilisés pour l'hébergement, l'authentification, l'e-mail, le paiement et le stockage sécurisé.",
  },
  {
    title: 'Vos droits',
    content:
      "Vous pouvez demander l'accès, la rectification, l'effacement, la limitation, la portabilité ou l'opposition au traitement de vos données lorsque ces droits sont applicables. Écrivez à legal@gosendbox.com. Vous pouvez également introduire une réclamation auprès de la CNIL.",
  },
]

export default function PolitiqueConfidentialitePage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <header className="mb-10 space-y-3">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Politique de confidentialité
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
          Cette politique explique les données traitées par Sendbox dans le
          cadre de la V1 : mise en relation, vérification d&apos;identité,
          déclaration colis, preuves photo, réputation, notifications, litiges
          et paiement des frais Sendbox.
        </p>
      </header>

      <div className="grid gap-4">
        {sections.map(section => (
          <section key={section.title} className="rounded-lg bg-muted/50 p-6">
            <h2 className="mb-3 text-xl font-semibold">{section.title}</h2>
            <p className="text-sm leading-7 text-muted-foreground sm:text-base">
              {section.content}
            </p>
          </section>
        ))}
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        Dernière mise à jour : 22 juillet 2026
      </p>
    </main>
  )
}
