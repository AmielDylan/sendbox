/**
 * Page Mentions Légales - Placeholder
 */

export default function MentionsLegalesPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Mentions Légales</h1>
      <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
        <p className="text-lg text-muted-foreground">
          Cette page sera complétée prochainement avec les mentions légales de Sendbox.
        </p>

        <div className="bg-muted/50 p-6 rounded-lg space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Éditeur du site</h2>
            <p className="text-muted-foreground">
              Sendbox<br />
              Plateforme de covalisage international entre l'Europe et l'Afrique<br />
              <span className="text-sm">(Actuellement disponible entre la France et le Bénin)</span>
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Contact</h2>
            <p className="text-muted-foreground">
              Email : contact@sendbox.fr
            </p>
          </div>
        </div>

        <div className="bg-muted/50 p-6 rounded-lg">
          <p className="text-muted-foreground">
            Pour toute question concernant les mentions légales, contactez-nous :
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
