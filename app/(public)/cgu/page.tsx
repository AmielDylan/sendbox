export const metadata = {
  title: "Conditions générales d'utilisation | Sendbox",
}

export default function CGUPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <header className="mb-10 flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Conditions générales d&apos;utilisation
        </h1>
        <p className="text-sm text-muted-foreground">
          Dernière mise à jour : 22 juillet 2026, version 1.1
        </p>
      </header>

      <div className="flex flex-col gap-10 text-sm leading-7 sm:text-base">
        {/* Article 1 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">Article 1 : Définitions</h2>
          <p>
            <strong>Sendbox</strong> désigne la plateforme éditée par AMIEL
            ADJOVI CONSULTING, entrepreneur individuel immatriculé sous le
            numéro SIRET 842&nbsp;963&nbsp;241&nbsp;00026, dont le siège est au
            92 rue Jean Marin Naudin, 92220 Bagneux.
          </p>
          <p>
            <strong>Utilisateur</strong> désigne toute personne physique
            inscrite sur la plateforme, qu&apos;elle agisse en qualité
            d&apos;expéditeur ou de voyageur.
          </p>
          <p>
            <strong>Expéditeur</strong> désigne l&apos;utilisateur souhaitant
            faire transporter un colis via un voyageur.
          </p>
          <p>
            <strong>Voyageur</strong> désigne l&apos;utilisateur proposant de
            transporter un colis dans le cadre d&apos;un voyage qu&apos;il
            effectue à titre personnel.
          </p>
          <p>
            <strong>Mise en relation</strong> désigne la confirmation mutuelle
            entre un expéditeur et un voyageur sur une transaction donnée.
          </p>
          <p>
            <strong>Transaction</strong> désigne l&apos;ensemble du cycle : mise
            en relation, remise du colis, transport, livraison et évaluation.
          </p>
          <p>
            <strong>Corridor</strong> désigne un itinéraire entre deux villes ou
            pays, dans les deux sens.
          </p>
        </section>

        {/* Article 2 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">
            Article 2 : Nature du service
          </h2>
          <p>
            Sendbox est une plateforme de mise en relation entre expéditeurs et
            voyageurs.
          </p>
          <p>Sendbox n&apos;est pas :</p>
          <ul className="ml-5 flex list-disc flex-col gap-1 text-muted-foreground">
            <li>un transporteur ou commissionnaire de transport,</li>
            <li>un intermédiaire de paiement entre expéditeur et voyageur,</li>
            <li>une compagnie d&apos;assurance,</li>
            <li>une société de cautionnement ou de garantie financière.</li>
          </ul>
          <p>Sendbox fournit exclusivement :</p>
          <ul className="ml-5 flex list-disc flex-col gap-1 text-muted-foreground">
            <li>un service de mise en relation entre utilisateurs vérifiés,</li>
            <li>
              un système de gestion de la réputation (évaluations, historique),
            </li>
            <li>
              un outil de traçabilité des transactions (photos horodatées,
              confirmations),
            </li>
            <li>une interface de médiation en cas de litige.</li>
          </ul>
          <p>
            Le contrat de transport du colis est conclu directement entre
            l&apos;expéditeur et le voyageur, hors plateforme, sous leur entière
            responsabilité.
          </p>
        </section>

        {/* Article 3 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">
            Article 3 : Inscription et vérification d&apos;identité
          </h2>

          <h3 className="font-semibold">3.1 Conditions d&apos;inscription</h3>
          <p>
            L&apos;inscription est réservée aux personnes physiques majeures (18
            ans ou plus) capables juridiquement. L&apos;inscription au nom
            d&apos;une personne morale n&apos;est pas autorisée en V1.
          </p>

          <h3 className="font-semibold">
            3.2 Vérification d&apos;identité obligatoire
          </h3>
          <p>
            La vérification d&apos;identité est obligatoire pour accéder aux
            fonctionnalités de mise en relation. Elle comprend :
          </p>
          <ul className="ml-5 flex list-disc flex-col gap-1 text-muted-foreground">
            <li>
              la fourniture d&apos;un document d&apos;identité officiel en cours
              de validité (passeport ou carte nationale d&apos;identité
              biométrique),
            </li>
            <li>
              une photo de l&apos;utilisateur tenant le document face caméra
              (selfie de vérification).
            </li>
          </ul>
          <p>
            Sont acceptés : les passeports de tous pays conformes à la norme
            ICAO 9303, et les cartes nationales d&apos;identité biométriques.
            Les documents non conformes aux normes de lisibilité internationale
            ne sont pas acceptés.
          </p>

          <h3 className="font-semibold">
            3.3 Traitement et suppression des documents
          </h3>
          <p>
            Les documents d&apos;identité uploadés sont stockés dans un espace
            sécurisé, accessible uniquement par les administrateurs Sendbox.
          </p>
          <p>
            Sendbox s&apos;engage à supprimer définitivement les fichiers
            (document et selfie) immédiatement après la décision de vérification
            (validation ou rejet), et au plus tard 72 heures après leur
            soumission.
          </p>
          <p>
            Aucune donnée biométrique n&apos;est conservée après la décision de
            vérification. Seul le résultat (identité vérifiée ou non) est
            enregistré dans votre profil.
          </p>
          <p>
            Après vérification, seules les informations suivantes sont
            conservées : statut de vérification, nom vérifié, et date de
            vérification.
          </p>

          <h3 className="font-semibold">3.4 Limites de la vérification</h3>
          <p>
            La vérification d&apos;identité effectuée par Sendbox vise à réduire
            les risques de fraude à l&apos;identité. Elle ne constitue pas une
            garantie absolue d&apos;authenticité et n&apos;engage pas la
            responsabilité de Sendbox en cas de document frauduleux non détecté
            malgré les contrôles mis en place.
          </p>

          <h3 className="font-semibold">3.5 Unicité du compte</h3>
          <p>
            Un utilisateur ne peut détenir qu&apos;un seul compte actif. Toute
            tentative de création de compte multiple après suspension ou
            bannissement entraîne un bannissement définitif de tous les comptes
            concernés.
          </p>
        </section>

        {/* Article 4 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">
            Article 4 : Publication d&apos;annonces de voyage
          </h2>

          <h3 className="font-semibold">4.1 Contenu de l&apos;annonce</h3>
          <p>
            Le voyageur qui publie un trip doit renseigner : pays et ville de
            départ, pays et ville d&apos;arrivée, date de départ, date
            d&apos;arrivée estimée, capacité disponible (en kg), et prix demandé
            par kilogramme.
          </p>

          <h3 className="font-semibold">4.2 Prix déclaré</h3>
          <p>
            Le voyageur fixe librement son prix par kilogramme dans les limites
            des fourchettes indicatives affichées par Sendbox pour chaque
            corridor. Ces fourchettes sont calculées sur la base des
            transactions complétées sur la plateforme et sont fournies à titre
            informatif uniquement.
          </p>
          <p>
            Le prix déclaré est définitivement verrouillé au moment de la
            confirmation mutuelle et ne peut être modifié après cette étape.
          </p>

          <h3 className="font-semibold">4.3 Exactitude des informations</h3>
          <p>
            Le voyageur s&apos;engage à fournir des informations exactes et à
            mettre à jour son annonce en cas de changement (report, annulation).
            Toute fausse déclaration peut entraîner la suspension du compte.
          </p>
        </section>

        {/* Article 5 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">
            Article 5 : Frais de mise en relation
          </h2>

          <h3 className="font-semibold">5.1 Montant</h3>
          <p>
            Des frais de mise en relation de{' '}
            <strong>2,90&nbsp;€&nbsp;TTC</strong> sont facturés à
            l&apos;expéditeur au moment de la confirmation mutuelle entre les
            deux parties.
          </p>
          <p>
            Ces frais rémunèrent le service de mise en relation fourni par
            Sendbox et sont distincts du prix du transport convenu entre
            expéditeur et voyageur.
          </p>
          <p>
            En V1, Sendbox n&apos;encaisse pas le prix du transport, ne conserve
            pas de fonds en attente et ne fournit pas de mécanisme
            d&apos;escrow.
          </p>

          <h3 className="font-semibold">5.2 Facturation</h3>
          <p>
            Les frais sont prélevés par carte bancaire via le prestataire de
            paiement Stripe. Le paiement doit être effectué pour que la mise en
            relation soit définitivement confirmée et que les coordonnées des
            parties soient échangées.
          </p>

          <h3 className="font-semibold">5.3 Non-remboursabilité</h3>
          <p>
            Les frais de mise en relation sont non remboursables une fois la
            confirmation mutuelle effectuée et le paiement validé, y compris en
            cas d&apos;annulation ultérieure de la transaction par l&apos;une ou
            l&apos;autre des parties.
          </p>

          <h3 className="font-semibold">5.4 Gratuité pour les voyageurs</h3>
          <p>
            L&apos;inscription, la publication d&apos;annonces et la mise en
            relation sont gratuites pour les voyageurs.
          </p>
        </section>

        {/* Article 6 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">
            Article 6 : Paiements entre utilisateurs
          </h2>
          <p>
            Le règlement du prix du transport convenu entre expéditeur et
            voyageur est effectué directement entre les parties, hors plateforme
            Sendbox, selon les modalités qu&apos;ils définissent librement.
          </p>
          <p>
            Sendbox n&apos;est pas partie à cet accord financier,
            n&apos;encaisse pas les sommes correspondantes, et ne peut être tenu
            responsable de tout litige relatif à ce paiement.
          </p>
          <p>
            Sendbox ne prélève pas de commission sur le prix du transport en V1.
            Toute évolution vers un paiement du transport sur la plateforme, une
            commission ou un reversement voyageur fera l&apos;objet de
            conditions distinctes.
          </p>
        </section>

        {/* Article 7 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">
            Article 7 : Contenu des colis
          </h2>

          <h3 className="font-semibold">7.1 Objets interdits</h3>
          <p>
            Sont strictement interdits dans les colis transportés via Sendbox :
          </p>
          <ul className="ml-5 flex list-disc flex-col gap-1 text-muted-foreground">
            <li>les stupéfiants et substances illicites,</li>
            <li>les armes, munitions et substances explosives,</li>
            <li>les contrefaçons et objets de contrebande,</li>
            <li>les espèces (billets de banque, monnaies),</li>
            <li>les documents officiels falsifiés,</li>
            <li>les matières dangereuses, inflammables ou radioactives,</li>
            <li>
              tout objet soumis à des restrictions douanières sans les
              déclarations requises,
            </li>
            <li>
              tout objet dont le transport est interdit par la législation du
              pays de départ ou d&apos;arrivée.
            </li>
          </ul>

          <h3 className="font-semibold">
            7.2 Responsabilité de l&apos;expéditeur
          </h3>
          <p>
            L&apos;expéditeur est seul responsable de la conformité légale et
            douanière du contenu du colis, de l&apos;exactitude de sa
            description, et du respect des règles d&apos;importation et
            d&apos;exportation applicables.
          </p>

          <h3 className="font-semibold">7.3 Droit de refus du voyageur</h3>
          <p>
            Le voyageur est en droit de refuser tout colis dont le contenu lui
            semble suspect, non conforme à la description, ou susceptible de
            l&apos;exposer à des risques légaux. Ce refus ne peut donner lieu à
            aucun remboursement des frais de mise en relation par
            l&apos;expéditeur.
          </p>
        </section>

        {/* Article 7 bis */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">
            Article 7 bis : Assurance et garantie colis
          </h2>
          <p>
            Sendbox ne vend pas d&apos;assurance colis en V1 et ne promet aucune
            indemnisation automatique en cas de perte, vol, retard ou
            endommagement.
          </p>
          <p>
            Les photos horodatées, confirmations, déclarations colis et
            historiques disponibles dans l&apos;application servent à documenter
            les faits en cas de litige, sans constituer une garantie financière
            ou une couverture d&apos;assurance.
          </p>
        </section>

        {/* Article 8 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">
            Article 8 : Déroulement d&apos;une transaction
          </h2>

          <h3 className="font-semibold">8.1 Étapes</h3>
          <p>
            Une transaction suit obligatoirement le cycle suivant sur la
            plateforme :
          </p>
          <ol className="ml-5 flex list-decimal flex-col gap-2 text-muted-foreground">
            <li>
              <strong className="text-foreground">Mise en relation</strong> :
              l&apos;expéditeur contacte le voyageur via la plateforme.
            </li>
            <li>
              <strong className="text-foreground">Accord mutuel</strong> : les
              deux parties confirment leur accord sur la plateforme. Le paiement
              des frais de mise en relation est requis à cette étape.
            </li>
            <li>
              <strong className="text-foreground">Remise du colis</strong> :
              l&apos;expéditeur remet le colis au voyageur. Les deux parties
              confirment la remise et une photo horodatée est prise.
            </li>
            <li>
              <strong className="text-foreground">Transport</strong> : le
              voyageur transporte le colis.
            </li>
            <li>
              <strong className="text-foreground">Livraison</strong> : le
              voyageur remet le colis au destinataire. Une photo horodatée est
              prise. Le destinataire confirme la réception.
            </li>
            <li>
              <strong className="text-foreground">Évaluation</strong> : les deux
              parties s&apos;évaluent mutuellement.
            </li>
          </ol>

          <h3 className="font-semibold">8.2 Photos horodatées</h3>
          <p>
            Les photos de remise et de livraison sont prises via
            l&apos;application et horodatées par les serveurs Sendbox au moment
            de l&apos;upload. L&apos;heure affichée est celle du serveur,
            indépendante des métadonnées de l&apos;appareil. Ces photos
            constituent des éléments de preuve en cas de litige.
          </p>
        </section>

        {/* Article 9 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">Article 9 : Évaluations</h2>

          <h3 className="font-semibold">9.1 Soumission simultanée</h3>
          <p>
            À l&apos;issue de chaque transaction, les deux parties
            s&apos;évaluent mutuellement. Chaque utilisateur soumet son
            évaluation sans avoir accès à celle de l&apos;autre partie avant
            d&apos;avoir soumis la sienne. Les deux évaluations sont publiées
            simultanément.
          </p>

          <h3 className="font-semibold">9.2 Immuabilité</h3>
          <p>
            Une évaluation publiée ne peut être ni modifiée ni supprimée par son
            auteur ou par Sendbox, sauf en cas de signalement d&apos;un contenu
            manifestement contraire aux présentes CGU (menaces, discours
            haineux, diffamation). Dans ce cas, seul le commentaire peut être
            masqué, la note restant visible.
          </p>

          <h3 className="font-semibold">9.3 Score de confiance</h3>
          <p>
            Sendbox calcule un score de confiance composite pour chaque
            utilisateur, basé sur les évaluations reçues, le nombre de
            transactions complétées, la diversité des contreparties, et les
            litiges en cours. Ce score est visible publiquement sur le profil de
            l&apos;utilisateur.
          </p>
        </section>

        {/* Article 10 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">
            Article 10 : Litiges entre utilisateurs
          </h2>

          <h3 className="font-semibold">10.1 Absence de levier financier</h3>
          <p>
            Sendbox ne détenant pas les fonds correspondant au prix du
            transport, elle ne peut ni imposer un remboursement, ni bloquer ou
            ordonner un paiement entre utilisateurs.
          </p>

          <h3 className="font-semibold">10.2 Ouverture d&apos;un litige</h3>
          <p>
            En cas de différend, tout utilisateur partie à la transaction peut
            ouvrir un litige via la plateforme. L&apos;ouverture d&apos;un
            litige :
          </p>
          <ul className="ml-5 flex list-disc flex-col gap-1 text-muted-foreground">
            <li>
              rend le signalement visible publiquement sur le profil des deux
              parties pendant toute la durée de l&apos;instruction,
            </li>
            <li>est irréversible,</li>
            <li>entraîne une instruction par un administrateur Sendbox.</li>
          </ul>

          <h3 className="font-semibold">10.3 Instruction et décision</h3>
          <p>
            Sendbox instruit le litige sur la base des éléments disponibles :
            photos horodatées, historique de confirmations, échanges enregistrés
            sur la plateforme, et éléments fournis par les parties.
          </p>
          <p>Sendbox peut prononcer l&apos;une des décisions suivantes :</p>
          <ul className="ml-5 flex list-disc flex-col gap-1 text-muted-foreground">
            <li>classement sans suite (litige retiré des profils publics),</li>
            <li>tort partagé,</li>
            <li>
              tort unilatéral avec impact sur le score de confiance de la partie
              fautive.
            </li>
          </ul>

          <h3 className="font-semibold">10.4 Recours extérieurs</h3>
          <p>
            Les parties conservent le droit d&apos;engager des recours légaux
            indépendants. Sendbox peut fournir l&apos;export de
            l&apos;historique de transaction comme élément de preuve sur demande
            formelle.
          </p>
        </section>

        {/* Article 11 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">
            Article 11 : Responsabilités de Sendbox
          </h2>
          <p>Sendbox ne saurait être tenu responsable :</p>
          <ul className="ml-5 flex list-disc flex-col gap-1 text-muted-foreground">
            <li>
              de la perte, du vol ou de l&apos;endommagement d&apos;un colis,
            </li>
            <li>du non-paiement du prix de transport entre les parties,</li>
            <li>
              des dommages causés par le contenu d&apos;un colis à des tiers ou
              aux autorités,
            </li>
            <li>
              des préjudices résultant d&apos;une information inexacte fournie
              par un utilisateur,
            </li>
            <li>
              de l&apos;indisponibilité temporaire de la plateforme pour
              maintenance ou incident,
            </li>
            <li>
              des conséquences d&apos;un document d&apos;identité frauduleux non
              détecté malgré les vérifications effectuées.
            </li>
          </ul>
          <p>
            La responsabilité de Sendbox est limitée au montant des frais de
            mise en relation perçus sur la transaction concernée.
          </p>
        </section>

        {/* Article 12 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">
            Article 12 : Suspension et exclusion
          </h2>
          <p>
            Sendbox se réserve le droit de suspendre ou de bannir définitivement
            tout compte en cas de :
          </p>
          <ul className="ml-5 flex list-disc flex-col gap-1 text-muted-foreground">
            <li>
              fausse déclaration lors de l&apos;inscription ou de la
              vérification d&apos;identité,
            </li>
            <li>
              tentative de fraude, d&apos;escroquerie ou d&apos;abus de
              confiance,
            </li>
            <li>transport d&apos;objets interdits,</li>
            <li>comportement abusif envers un autre utilisateur,</li>
            <li>
              manipulation du système d&apos;évaluation (collusion, faux avis),
            </li>
            <li>création de comptes multiples,</li>
            <li>
              tout comportement portant atteinte à la confiance et au bon
              fonctionnement de la plateforme.
            </li>
          </ul>
          <p>
            La suspension peut être temporaire (pendant l&apos;instruction
            d&apos;un litige) ou définitive. Aucun remboursement des frais de
            mise en relation n&apos;est dû en cas de suspension ou de
            bannissement pour faute.
          </p>
        </section>

        {/* Article 13 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">
            Article 13 : Données personnelles
          </h2>

          <h3 className="font-semibold">13.1 Responsable de traitement</h3>
          <p>
            AMIEL ADJOVI CONSULTING, 92 rue Jean Marin Naudin, 92220 Bagneux,{' '}
            <a
              href="mailto:legal@gosendbox.com"
              className="underline underline-offset-4"
            >
              legal@gosendbox.com
            </a>
          </p>

          <h3 className="font-semibold">13.2 Données collectées</h3>
          <ul className="ml-5 flex list-disc flex-col gap-1 text-muted-foreground">
            <li>Données d&apos;inscription : nom, prénom, email, téléphone.</li>
            <li>
              Données de vérification d&apos;identité : document officiel et
              selfie, traités et supprimés dans un délai maximum de 72 heures.
              Seuls le statut de vérification, le nom vérifié et la date sont
              conservés.
            </li>
            <li>
              Données de transaction : historique, photos horodatées,
              évaluations.
            </li>
            <li>
              Données de paiement : gérées directement par Stripe, non stockées
              par Sendbox.
            </li>
          </ul>

          <h3 className="font-semibold">13.3 Durées de conservation</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 pr-6 text-left font-semibold">Donnée</th>
                  <th className="py-2 text-left font-semibold">Durée</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b">
                  <td className="py-2 pr-6">
                    Documents d&apos;identité (images)
                  </td>
                  <td className="py-2">Supprimés sous 72h après soumission</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-6">Photos de transaction</td>
                  <td className="py-2">12 mois après la transaction</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-6">Historique des transactions</td>
                  <td className="py-2">5 ans (preuve légale)</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-6">Évaluations publiées</td>
                  <td className="py-2">Durée de vie du compte</td>
                </tr>
                <tr>
                  <td className="py-2 pr-6">Données du compte</td>
                  <td className="py-2">Durée d&apos;activité + 3 ans</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="font-semibold">13.4 Droits des utilisateurs</h3>
          <p>
            Conformément au RGPD, tout utilisateur dispose des droits
            d&apos;accès, de rectification, d&apos;effacement, de portabilité et
            d&apos;opposition, exercébles à{' '}
            <a
              href="mailto:legal@gosendbox.com"
              className="underline underline-offset-4"
            >
              legal@gosendbox.com
            </a>
            . Délai de réponse : 30 jours.
          </p>
          <p>
            Le droit à l&apos;effacement ne s&apos;applique pas aux données
            conservées pour des obligations légales (historique de transactions,
            5 ans).
          </p>

          <h3 className="font-semibold">13.5 Hébergement</h3>
          <p>
            Les données sont hébergées par Supabase (infrastructure AWS
            eu-west-1 ou équivalent européen). Les paiements sont gérés par
            Stripe (certifié PCI-DSS).
          </p>
        </section>

        {/* Article 14 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">
            Article 14 : Propriété intellectuelle
          </h2>
          <p>
            La marque Sendbox, le logo, le code source et tous les contenus
            produits par Sendbox sont la propriété exclusive de AMIEL ADJOVI
            CONSULTING. Toute reproduction sans autorisation écrite est
            interdite.
          </p>
          <p>
            Les utilisateurs accordent à Sendbox une licence non exclusive
            d&apos;utilisation de leurs évaluations et avis publiés, aux fins
            d&apos;affichage sur la plateforme.
          </p>
        </section>

        {/* Article 15 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">
            Article 15 : Modification des CGU
          </h2>
          <p>
            Sendbox se réserve le droit de modifier les présentes CGU à tout
            moment. Les utilisateurs sont notifiés par email au moins 15 jours
            avant l&apos;entrée en vigueur des modifications. L&apos;utilisation
            de la plateforme après cette date vaut acceptation des nouvelles
            CGU.
          </p>
        </section>

        {/* Article 16 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">
            Article 16 : Droit applicable et juridiction
          </h2>
          <p>Les présentes CGU sont soumises au droit français.</p>
          <p>
            En cas de litige relatif à l&apos;interprétation ou à
            l&apos;exécution des présentes, et à défaut de résolution amiable
            dans un délai de 30 jours, les tribunaux compétents sont ceux du
            ressort de Paris.
          </p>
          <p>
            Conformément aux articles L.611-1 et suivants du Code de la
            consommation, tout utilisateur résidant dans l&apos;Union européenne
            peut recourir gratuitement au médiateur de la consommation :{' '}
            <strong>
              CM2C, Centre de Médiation de la Consommation de Conciliateurs de
              Justice
            </strong>{' '}
            (
            <a
              href="https://www.cm2c.net"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4"
            >
              cm2c.net
            </a>
            ).
          </p>
        </section>
      </div>
    </main>
  )
}
