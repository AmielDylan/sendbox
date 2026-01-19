export default function MentionsLegalesPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Mentions Légales</h1>
      <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
        <p className="text-lg text-muted-foreground">
          Les présentes mentions légales concernent le service Sendbox accessible sur www.gosendbox.com.
        </p>

        <div className="bg-muted/50 p-6 rounded-lg space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Éditeur du site</h2>
            <p className="text-muted-foreground">
              Sendbox<br />
              Exploitant : AMIEL DYLAN ADJOVI<br />
              Statut : Auto-entrepreneur<br />
              SIRET : 84296324100026
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">TVA</h2>
            <p className="text-muted-foreground">
              TVA non applicable - art. 293B du CGI
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Contact</h2>
            <p className="text-muted-foreground">
              Email : contact@gosendbox.com
            </p>
          </div>
        </div>

        <div className="bg-muted/50 p-6 rounded-lg">
          <p className="text-muted-foreground">
            Pour toute question concernant les mentions légales, contactez-nous :
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
