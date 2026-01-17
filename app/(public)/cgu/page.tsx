/**
 * Page CGU (Conditions Générales d'Utilisation) - Placeholder
 */

export default function CGUPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Conditions Générales d'Utilisation</h1>
      <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
        <p className="text-lg text-muted-foreground">
          Cette page sera complétée prochainement avec les conditions générales d'utilisation de Sendbox.
        </p>
        <div className="bg-muted/50 p-6 rounded-lg">
          <p className="text-muted-foreground">
            Pour toute question concernant nos conditions d'utilisation, n'hésitez pas à nous contacter :
          </p>
          <p className="font-medium mt-2">
            contact@sendbox.fr
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
