export default function PolitiqueConfidentialitePage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Politique de Confidentialité</h1>
      <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
        <p className="text-lg text-muted-foreground">
          Cette politique explique les données traitées par Sendbox dans le
          cadre de la V1 : mise en relation, vérification d&apos;identité,
          déclaration colis, preuves photo, notifications et paiement des frais
          de mise en relation.
        </p>
        <div className="bg-muted/50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">
            Données collectées
          </h2>
          <p className="text-muted-foreground">
            Sendbox traite les données de compte, les informations de profil,
            les données de vérification d&apos;identité, les annonces, les
            demandes de transport, la déclaration du contenu des colis, les
            photos horodatées, les avis, les signalements et les litiges.
          </p>
        </div>
        <div className="bg-muted/50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">
            Paiement des frais Sendbox
          </h2>
          <p className="text-muted-foreground">
            En V1, Sendbox encaisse uniquement les frais de mise en relation
            réglés par carte bancaire via Stripe. Le prix du transport est
            réglé directement entre utilisateurs, hors plateforme. Sendbox ne
            stocke pas les données complètes de carte bancaire.
          </p>
        </div>
        <div className="bg-muted/50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">
            Conservation des preuves
          </h2>
          <p className="text-muted-foreground">
            Les photos de remise et de livraison, les confirmations, les
            historiques de transaction et les éléments de litige peuvent être
            conservés afin de documenter les faits, lutter contre les abus et
            permettre l&apos;instruction des signalements.
          </p>
        </div>
        <div className="bg-muted/50 p-6 rounded-lg">
          <p className="text-muted-foreground">
            Pour toute question concernant la confidentialité de vos données,
            contactez-nous :
          </p>
          <p className="font-medium mt-2">contact@gosendbox.com</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Dernière mise à jour : 22 juillet 2026
        </p>
      </div>
    </div>
  )
}
