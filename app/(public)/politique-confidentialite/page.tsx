/**
 * Page Politique de Confidentialité - Placeholder
 */

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Politique de Confidentialité</h1>
      <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
        <p className="text-lg text-muted-foreground">
          Cette page sera complétée prochainement avec notre politique de confidentialité détaillée.
        </p>
        <div className="bg-muted/50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Protection de vos données</h2>
          <p className="text-muted-foreground">
            Chez Sendbox, nous prenons la protection de vos données personnelles très au sérieux.
            Notre politique de confidentialité détaillée sera publiée prochainement.
          </p>
        </div>
        <div className="bg-muted/50 p-6 rounded-lg">
          <p className="text-muted-foreground">
            Pour toute question concernant la confidentialité de vos données, contactez-nous :
          </p>
          <p className="font-medium mt-2">
            contact@gosendbox.com
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>
    </div>
  )
}
