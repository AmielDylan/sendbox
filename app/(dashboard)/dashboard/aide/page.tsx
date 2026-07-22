'use client'

import { useState } from 'react'
import { IconChevronDown, IconSend } from '@tabler/icons-react'
import { PageHeader } from '@/components/ui/page-header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const faqCategories = [
  {
    title: 'Premiers pas',
    questions: [
      {
        q: 'Comment fonctionne Sendbox ?',
        a: "Sendbox met en relation des expéditeurs et des voyageurs vérifiés. L'expéditeur décrit son colis, le voyageur accepte ou refuse la demande, puis les deux parties confirment la mise en relation. En V1, Sendbox encaisse uniquement les frais de mise en relation ; le transport se règle directement entre les parties, hors plateforme.",
      },
      {
        q: 'Comment créer un compte ?',
        a: "Rendez-vous sur la page d'inscription, renseignez votre adresse e-mail et choisissez un mot de passe. Vous recevrez un e-mail de confirmation pour activer votre compte.",
      },
      {
        q: 'Comment vérifier mon identité ?',
        a: "La vérification d'identité se fait depuis Réglages > Vérification d'identité. Vous devez fournir une pièce d'identité valide et un selfie de vérification. Votre dossier passe ensuite en revue admin avant validation ou refus.",
      },
      {
        q: 'Puis-je utiliser Sendbox sans vérifier mon identité ?',
        a: 'Vous pouvez consulter certaines pages sans vérification. En revanche, publier un trajet, envoyer une demande de colis ou finaliser une mise en relation nécessite un profil vérifié.',
      },
    ],
  },
  {
    title: 'Envoyer un colis',
    questions: [
      {
        q: 'Comment trouver un voyageur pour mon colis ?',
        a: 'Utilisez la page Rechercher pour trouver des annonces de voyageurs selon votre destination et vos dates. Vous pouvez ensuite envoyer une demande directement depuis la fiche du voyageur.',
      },
      {
        q: 'Comment préparer mon colis ?',
        a: "Votre colis doit être correctement emballé, facile à identifier et conforme à la déclaration faite dans Sendbox. Indiquez clairement le contenu, la catégorie, le poids, les dimensions et la valeur estimée afin que le voyageur sache ce qu'il accepte.",
      },
      {
        q: 'Quels articles sont interdits ?',
        a: 'Sont interdits : produits illicites, armes, munitions, explosifs, contrefaçons, espèces, documents falsifiés, matières dangereuses, inflammables ou radioactives, ainsi que tout objet interdit ou soumis à restriction par les lois du pays de départ ou d’arrivée.',
      },
      {
        q: 'Que faire si mon colis est endommagé ou perdu ?',
        a: "Contactez immédiatement le voyageur via la messagerie et rassemblez les preuves disponibles : déclaration colis, échanges, photos de remise ou de livraison. Si aucune solution n'est trouvée, ouvrez un litige depuis le détail du colis ou une demande d'assistance. En V1, Sendbox ne vend pas d'assurance et ne promet pas d'indemnisation automatique.",
      },
    ],
  },
  {
    title: 'Transporter un colis',
    questions: [
      {
        q: 'Comment accepter une demande de transport ?',
        a: 'Publiez votre trajet dans la section Annonces en indiquant votre destination, vos dates, votre capacité disponible et votre prix indicatif. Les expéditeurs peuvent vous envoyer une demande. Avant acceptation, relisez la déclaration colis et refusez si le contenu est flou, risqué ou incompatible avec votre trajet.',
      },
      {
        q: 'Quelles règles dois-je respecter en tant que voyageur ?',
        a: 'En acceptant de transporter un colis, vous vous engagez à transporter uniquement des articles légaux et déclarés, à respecter les règles douanières applicables et à refuser tout colis suspect ou différent de sa déclaration.',
      },
      {
        q: 'Comment confirmer une livraison ?',
        a: 'Une fois le colis remis au destinataire, utilisez le parcours prévu dans le détail du colis pour ajouter les preuves attendues et confirmer la livraison. Cette confirmation sert à tracer la transaction et à permettre les avis, pas à déclencher un reversement voyageur par Sendbox en V1.',
      },
    ],
  },
  {
    title: 'Paiements',
    questions: [
      {
        q: 'Comment fonctionnent les paiements ?',
        a: "En V1, l'expéditeur paie uniquement les frais Sendbox de mise en relation, fixés à 2,90 € et facturés en EUR après confirmation mutuelle. Le prix du transport se négocie et se règle directement entre l'expéditeur et le voyageur, hors plateforme.",
      },
      {
        q: 'Quand est-ce que je suis payé en tant que voyageur ?',
        a: "Sendbox ne reverse pas le prix du transport au voyageur en V1. Le voyageur et l'expéditeur conviennent directement du montant et du moyen de règlement du transport, hors plateforme.",
      },
      {
        q: 'Que faire en cas de problème de paiement ?',
        a: "Si le problème concerne les frais Sendbox de mise en relation, utilisez l'onglet Demande d'assistance en sélectionnant le type « Problème de paiement ». Si le problème concerne le règlement du transport entre utilisateurs, ouvrez un litige ou contactez l'autre partie via la messagerie : Sendbox ne détient pas ces fonds en V1.",
      },
      {
        q: 'Les frais sont-ils affichés en FCFA ou XOF ?',
        a: 'Non. La V1 garde un tarif simple en EUR : 2,90 € par mise en relation. Si votre carte est rattachée à une autre devise, votre banque peut appliquer sa conversion et ses frais éventuels.',
      },
    ],
  },
  {
    title: 'Sécurité et confiance',
    questions: [
      {
        q: 'Comment les utilisateurs sont-ils vérifiés ?',
        a: "Chaque utilisateur doit effectuer une vérification d'identité pour accéder aux mises en relation. Les profils vérifiés peuvent ensuite publier, demander ou accepter une mise en relation selon leur rôle.",
      },
      {
        q: 'Comment signaler un comportement suspect ?',
        a: "Utilisez l'onglet Demande d'assistance en sélectionnant « Signalement », ou ouvrez un litige depuis le détail du colis si une réservation est concernée. Décrivez les faits précisément et ajoutez les preuves disponibles.",
      },
      {
        q: 'Mes données personnelles sont-elles protégées ?',
        a: 'Sendbox traite vos données conformément au RGPD. Vos coordonnées ne sont jamais affichées publiquement. Pour en savoir plus, consultez notre Politique de confidentialité.',
      },
    ],
  },
]

const supportTypes = [
  { value: 'bug', label: 'Problème technique', feedbackType: 'bug' as const },
  {
    value: 'colis',
    label: 'Question sur un colis',
    feedbackType: 'other' as const,
  },
  {
    value: 'paiement',
    label: 'Problème de frais Sendbox',
    feedbackType: 'bug' as const,
  },
  {
    value: 'signalement',
    label: 'Signalement',
    feedbackType: 'other' as const,
  },
  { value: 'autre', label: 'Autre', feedbackType: 'other' as const },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-muted/60">
        <span>{q}</span>
        <IconChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4 pt-1">
        <p className="text-sm leading-relaxed text-muted-foreground">{a}</p>
      </CollapsibleContent>
    </Collapsible>
  )
}

function FaqTab() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {faqCategories.map(category => (
        <div
          key={category.title}
          className="overflow-hidden rounded-xl border bg-card"
        >
          <div className="border-b bg-primary/8 px-4 py-3">
            <h2 className="text-sm font-semibold text-primary">
              {category.title}
            </h2>
          </div>
          <div className="divide-y">
            {category.questions.map(item => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function AssistanceTab() {
  const [type, setType] = useState<string>('autre')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!subject.trim() || !message.trim()) return

    setLoading(true)
    const selected = supportTypes.find(t => t.value === type)
    const feedbackType = selected?.feedbackType ?? 'other'
    const fullMessage = `[${selected?.label ?? 'Autre'}] ${subject}\n\n${message}`

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: feedbackType, message: fullMessage }),
      })

      if (!res.ok) throw new Error()

      toast.success(
        'Votre demande a bien été envoyée. Notre équipe vous répondra par e-mail.'
      )
      setSubject('')
      setMessage('')
      setType('autre')
    } catch {
      toast.error(
        'Une erreur est survenue. Veuillez réessayer ou nous contacter à contact@gosendbox.com.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border bg-card">
      <div className="border-b px-6 py-4">
        <h2 className="text-sm font-semibold">Nouvelle demande d'assistance</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Décrivez votre problème, notre équipe vous répondra par e-mail.
        </p>
      </div>
      <div className="space-y-5 p-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Type de demande</Label>
          <RadioGroup
            value={type}
            onValueChange={setType}
            className="grid grid-cols-1 gap-2 sm:grid-cols-2"
          >
            {supportTypes.map(t => (
              <div
                key={t.value}
                className={cn(
                  'flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 transition-colors',
                  type === t.value
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted/40'
                )}
                onClick={() => setType(t.value)}
              >
                <RadioGroupItem value={t.value} id={t.value} />
                <Label
                  htmlFor={t.value}
                  className="cursor-pointer text-sm font-normal"
                >
                  {t.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="subject" className="text-sm font-medium">
            Sujet
          </Label>
          <Input
            id="subject"
            placeholder="Résumez votre problème en quelques mots"
            value={subject}
            onChange={e => setSubject(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="message" className="text-sm font-medium">
            Message
          </Label>
          <Textarea
            id="message"
            placeholder="Décrivez votre situation avec le plus de détails possible..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={6}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={loading || !subject.trim() || !message.trim()}
          className="w-full sm:w-auto"
        >
          <IconSend className="mr-2 h-4 w-4" />
          {loading ? 'Envoi en cours...' : 'Envoyer la demande'}
        </Button>
      </div>
    </div>
  )
}

export default function AidePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Centre d'aide"
        description="Trouvez des réponses aux questions fréquentes ou contactez notre équipe."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: "Centre d'aide" },
        ]}
      />

      <Tabs defaultValue="faq">
        <TabsList>
          <TabsTrigger value="faq">Questions fréquentes</TabsTrigger>
          <TabsTrigger value="assistance">Demande d'assistance</TabsTrigger>
        </TabsList>
        <TabsContent value="faq" className="mt-4">
          <FaqTab />
        </TabsContent>
        <TabsContent value="assistance" className="mt-4">
          <AssistanceTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
