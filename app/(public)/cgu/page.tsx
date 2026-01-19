export default function CGUPage() {
  const lastUpdated = '19 janvier 2026'

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Conditions Générales d'Utilisation</h1>
      <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
        <p className="text-lg text-muted-foreground">
          Les présentes Conditions Générales d&apos;Utilisation (ci-après « CGU ») encadrent l&apos;accès et
          l&apos;utilisation de la plateforme Sendbox (ci-après la « Plateforme »), accessible notamment à
          l&apos;adresse www.gosendbox.com et exploitée par un auto-entrepreneur de droit français (ci-après
          « l&apos;Exploitant »). En utilisant la Plateforme, l&apos;Utilisateur reconnaît avoir lu, compris et
          accepté sans réserve les présentes CGU.
        </p>

        <h2>1. Objet</h2>
        <p>
          Sendbox est une plateforme numérique de mise en relation entre particuliers souhaitant expédier
          un objet ou un colis (« Expéditeur ») et particuliers qui transportent un objet à l&apos;occasion
          d&apos;un déplacement déjà prévu (« Voyageur »).
        </p>

        <h2>2. Définitions</h2>
        <ul>
          <li><strong>Plateforme</strong> : le site, l&apos;application et les services numériques Sendbox.</li>
          <li><strong>Utilisateur</strong> : toute personne disposant d&apos;un compte et utilisant la Plateforme.</li>
          <li><strong>Expéditeur</strong> : l&apos;Utilisateur qui publie une demande d&apos;expédition.</li>
          <li><strong>Demandeur</strong> : l&apos;Expéditeur, lorsqu&apos;il initie une demande d&apos;expédition.</li>
          <li><strong>Voyageur</strong> : l&apos;Utilisateur qui publie une offre de transport.</li>
          <li><strong>Transaction</strong> : l&apos;accord conclu entre un Expéditeur et un Voyageur pour le transport.</li>
        </ul>

        <h2>3. Nature du service - Absence de rôle de transporteur</h2>
        <p>Sendbox n&apos;est pas :</p>
        <ul>
          <li>un transporteur, un transitaire ou un commissionnaire de transport,</li>
          <li>un assureur, ni un dépositaire des objets transportés.</li>
        </ul>
        <p>
          Sendbox agit exclusivement comme intermédiaire technique. Aucun contrat de transport n&apos;est
          conclu avec Sendbox ; le cas échéant, ce contrat est conclu directement entre l&apos;Expéditeur
          et le Voyageur.
        </p>

        <h2>4. Conditions d&apos;accès à la Plateforme</h2>
        <p>L&apos;accès à la Plateforme est réservé aux personnes :</p>
        <ul>
          <li>majeures et juridiquement capables,</li>
          <li>disposant d&apos;informations exactes et à jour.</li>
        </ul>
        <p>
          L&apos;Utilisateur s&apos;engage à fournir des informations sincères et à les maintenir à jour. Sendbox
          se réserve le droit de suspendre ou supprimer un compte en cas d&apos;information inexacte,
          incomplète ou trompeuse.
        </p>

        <h2>5. Fonctionnement du service</h2>
        <p>Sendbox permet :</p>
        <ul>
          <li>la publication d&apos;offres de transport par les Voyageurs,</li>
          <li>la publication de demandes d&apos;expédition par les Expéditeurs,</li>
          <li>la mise en relation et la messagerie entre Utilisateurs,</li>
          <li>la facilitation du paiement et la perception d&apos;une commission de service.</li>
        </ul>
        <p>
          Sendbox ne vérifie pas physiquement le contenu des colis, l&apos;identité réelle des Utilisateurs,
          ni la conformité douanière ou réglementaire des objets transportés.
        </p>

        <h2>6. Responsabilités des Utilisateurs</h2>
        <h3>6.1 Responsabilité de l&apos;Expéditeur</h3>
        <p>L&apos;Expéditeur est seul responsable :</p>
        <ul>
          <li>du contenu, de la licéité et de la conformité des objets expédiés,</li>
          <li>des formalités douanières et réglementaires,</li>
          <li>du conditionnement et de l&apos;emballage adaptés du colis.</li>
        </ul>
        <p>
          Il garantit que le colis ne contient aucun objet interdit ou dangereux et qu&apos;il est conforme
          aux déclarations effectuées sur la Plateforme.
        </p>

        <h3>6.2 Responsabilité du Voyageur</h3>
        <p>Le Voyageur est seul responsable :</p>
        <ul>
          <li>du transport effectif du colis,</li>
          <li>de la conservation du colis durant le transport,</li>
          <li>du respect des règles douanières, de transport et de sécurité applicables.</li>
        </ul>
        <p>Il agit en son nom propre et sous sa seule responsabilité.</p>

        <h2>7. Objets strictement interdits</h2>
        <p>
          Il est strictement interdit d&apos;utiliser Sendbox pour transporter, notamment (liste non exhaustive) :
        </p>
        <ul>
          <li>argent liquide, titres financiers,</li>
          <li>documents officiels (passeport, carte d&apos;identité, visa),</li>
          <li>substances illicites ou réglementées,</li>
          <li>médicaments, produits pharmaceutiques,</li>
          <li>armes, explosifs, substances dangereuses,</li>
          <li>objets de grande valeur non déclarés,</li>
          <li>tout objet prohibé par la loi ou les autorités douanières.</li>
        </ul>
        <p>Tout manquement engage exclusivement la responsabilité des Utilisateurs concernés.</p>

        <h2>8. Paiement - Commission - Annulation</h2>
        <p>
          Les paiements sont effectués via un prestataire de paiement sécurisé. Le montant dû par
          l&apos;Expéditeur est collecté lors de la mise en relation et reste en attente de livraison.
        </p>
        <p>
          La libération des fonds intervient après validation de la remise finale par le Demandeur via
          son espace personnel sur la Plateforme. À défaut de validation explicite dans un délai raisonnable,
          et en l&apos;absence de contestation, Sendbox se réserve le droit de libérer les fonds selon les
          modalités qu&apos;elle juge appropriées. À défaut de validation ou de contestation dans un délai de
          sept (7) jours suivant la remise déclarée, celle-ci est réputée acceptée et les fonds sont
          automatiquement libérés.
        </p>
        <p>
          La remise du colis entre l&apos;Expéditeur et le Voyageur est matérialisée par un système de double
          validation par code QR, scanné réciproquement par les deux parties via la Plateforme. Cette
          validation vaut preuve de remise volontaire du colis, sans préjuger du contenu, de l&apos;état ou
          de la conformité du colis. En cas d&apos;absence du destinataire lors de la remise finale, aucune
          responsabilité ne saurait être imputée à la Plateforme. Toute gestion ultérieure du colis
          relève exclusivement des Utilisateurs concernés.
        </p>
        <p>
          En cas d&apos;annulation, seul le montant destiné au Voyageur peut être remboursé. La commission
          de service perçue par la Plateforme demeure non remboursable, sauf décision exceptionnelle
          de la Plateforme.
        </p>

        <h2>9. Absence d&apos;assurance</h2>
        <p>
          Sendbox ne propose aucune assurance couvrant les colis, les retards, les pertes ou les dommages.
          L&apos;Expéditeur et le Voyageur restent libres de souscrire toute assurance utile auprès d&apos;un
          assureur de leur choix.
        </p>

        <h2>10. Limitation de responsabilité (clause clé)</h2>
        <p>Sendbox ne saurait être tenue responsable, directement ou indirectement, de :</p>
        <ul>
          <li>la perte, le vol ou la détérioration d&apos;un colis,</li>
          <li>les retards,</li>
          <li>les litiges entre Utilisateurs,</li>
          <li>les saisies ou sanctions douanières,</li>
          <li>tout dommage matériel, financier ou moral.</li>
        </ul>
        <p>
          La responsabilité de Sendbox est strictement limitée au montant de la commission perçue,
          quel que soit le préjudice allégué.
        </p>

        <h2>11. Litiges entre Utilisateurs</h2>
        <p>
          Les litiges entre Expéditeur et Voyageur relèvent exclusivement de leur responsabilité. Sendbox
          peut, à titre purement facultatif, faciliter la communication, suspendre une transaction ou
          bloquer un compte. Sendbox n&apos;est pas arbitre et n&apos;est tenue à aucune obligation de résolution.
        </p>

        <h2>12. Suspension - Résiliation</h2>
        <p>Sendbox se réserve le droit, sans préavis ni justification, de :</p>
        <ul>
          <li>suspendre un compte,</li>
          <li>refuser une transaction,</li>
          <li>supprimer l&apos;accès à la Plateforme,</li>
        </ul>
        <p>notamment en cas de suspicion de fraude, de non-respect des CGU ou de risque juridique.</p>

        <h2>13. Propriété intellectuelle</h2>
        <p>
          La Plateforme, ses marques, contenus, textes, graphismes, logos et logiciels sont protégés par
          les droits de propriété intellectuelle. Toute reproduction ou utilisation non autorisée est
          interdite.
        </p>

        <h2>14. Données personnelles</h2>
        <p>
          Les données personnelles sont traitées conformément à la Politique de confidentialité,
          accessible sur la Plateforme.
        </p>

        <h2>15. Modification des CGU</h2>
        <p>
          Sendbox se réserve le droit de modifier les présentes CGU à tout moment. Les CGU applicables
          sont celles en vigueur à la date d&apos;utilisation du service.
        </p>

        <h2>16. Droit applicable - Juridiction</h2>
        <p>
          Les présentes CGU sont soumises au droit français. Tout litige relatif à leur interprétation
          ou exécution relève de la compétence exclusive des tribunaux français, nonobstant pluralité
          de défendeurs ou appel en garantie.
        </p>

        <h2>17. Contact</h2>
        <div className="bg-muted/50 p-6 rounded-lg">
          <p className="text-muted-foreground">
            Pour toute question concernant ces CGU, vous pouvez nous contacter :
          </p>
          <p className="font-medium mt-2">contact@gosendbox.com</p>
        </div>

        <h2>18. Acceptation</h2>
        <p>
          L&apos;utilisation de la Plateforme vaut acceptation pleine, entière et sans réserve des présentes
          CGU.
        </p>

        <p className="text-sm text-muted-foreground">Dernière mise à jour : {lastUpdated}</p>
      </div>
    </div>
  )
}
