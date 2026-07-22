export const metadata = {
  title: 'Mentions légales | Sendbox',
}

export default function MentionsLegalesPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <header className="mb-10 space-y-3">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Mentions légales
        </h1>
        <p className="text-sm leading-6 text-muted-foreground sm:text-base">
          Les présentes mentions légales concernent le service Sendbox
          accessible sur www.gosendbox.com.
        </p>
      </header>

      <div className="space-y-4">
        <section className="rounded-lg bg-muted/50 p-6">
          <h2 className="mb-3 text-xl font-semibold">Éditeur du site</h2>
          <p className="text-sm leading-7 text-muted-foreground sm:text-base">
            Sendbox est édité par AMIEL ADJOVI CONSULTING, entrepreneur
            individuel immatriculé sous le numéro SIRET 842 963 241 00026.
            <br />
            Adresse : 92 rue Jean Marin Naudin, 92220 Bagneux, France.
          </p>
        </section>

        <section className="rounded-lg bg-muted/50 p-6">
          <h2 className="mb-3 text-xl font-semibold">Contact</h2>
          <p className="text-sm leading-7 text-muted-foreground sm:text-base">
            Contact général : contact@gosendbox.com
            <br />
            Données personnelles et demandes juridiques : legal@gosendbox.com
          </p>
        </section>

        <section className="rounded-lg bg-muted/50 p-6">
          <h2 className="mb-3 text-xl font-semibold">TVA</h2>
          <p className="text-sm leading-7 text-muted-foreground sm:text-base">
            TVA non applicable, article 293 B du Code général des impôts.
          </p>
        </section>

        <section className="rounded-lg bg-muted/50 p-6">
          <h2 className="mb-3 text-xl font-semibold">Hébergement</h2>
          <p className="text-sm leading-7 text-muted-foreground sm:text-base">
            Le site est hébergé par Vercel Inc. Les données applicatives sont
            hébergées auprès des prestataires techniques indiqués dans la
            politique de confidentialité.
          </p>
        </section>
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        Dernière mise à jour : 22 juillet 2026
      </p>
    </main>
  )
}
