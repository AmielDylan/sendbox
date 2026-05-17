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
        a: 'Sendbox met en relation des expéditeurs et des voyageurs. Un expéditeur dépose un colis, un voyageur qui effectue le trajet correspondant accepte de le transporter contre rémunération. Une fois la livraison confirmée, le paiement est libéré automatiquement.',
      },
      {
        q: 'Comment créer un compte ?',
        a: "Rendez-vous sur la page d'inscription, renseignez votre adresse e-mail et choisissez un mot de passe. Vous recevrez un e-mail de confirmation pour activer votre compte.",
      },
      {
        q: 'Comment vérifier mon identité ?',
        a: "La vérification d'identité (KYC) se fait depuis la section Réglages > Vérification d'identité. Vous devrez fournir une pièce d'identité valide. La vérification est généralement traitée sous 24 à 48 heures.",
      },
      {
        q: 'Puis-je utiliser Sendbox sans vérifier mon identité ?',
        a: "Vous pouvez consulter les annonces sans vérification. Cependant, pour envoyer ou transporter un colis et recevoir des paiements, la vérification d'identité est requise.",
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
        a: 'Votre colis doit être correctement emballé, étanche si nécessaire, et ne pas dépasser le poids et les dimensions convenus avec le voyageur. Joignez une description claire du contenu.',
      },
      {
        q: 'Quels articles sont interdits ?',
        a: 'Sont interdits : les produits illicites, les médicaments sur ordonnance, les liquides en grande quantité, les matières dangereuses ou inflammables, les objets de valeur non déclarés, ainsi que tout article soumis à des restrictions douanières.',
      },
      {
        q: 'Que faire si mon colis est endommagé ou perdu ?',
        a: "Contactez immédiatement le voyageur via la messagerie. Si aucune solution n'est trouvée, ouvrez une demande d'assistance depuis cet espace. Notre équipe examinera la situation et vous guidera.",
      },
    ],
  },
  {
    title: 'Transporter un colis',
    questions: [
      {
        q: 'Comment accepter une demande de transport ?',
        a: 'Publiez votre trajet dans la section Voyages en indiquant votre destination, vos dates et la capacité disponible. Les expéditeurs peuvent alors vous contacter. Vous pouvez accepter ou refuser chaque demande.',
      },
      {
        q: 'Quelles règles dois-je respecter en tant que voyageur ?',
        a: "En acceptant de transporter un colis, vous vous engagez à respecter les lois douanières du pays de destination, à ne transporter que des articles légaux et déclarés, et à remettre le colis dans l'état convenu.",
      },
      {
        q: 'Comment confirmer une livraison ?',
        a: 'Une fois le colis remis au destinataire, marquez la livraison comme effectuée depuis votre espace Colis. Le destinataire devra confirmer la réception pour déclencher le paiement.',
      },
    ],
  },
  {
    title: 'Paiements',
    questions: [
      {
        q: 'Comment fonctionnent les paiements ?',
        a: "L'expéditeur règle le montant convenu au moment de la confirmation de la demande. Les fonds sont conservés en séquestre par Sendbox jusqu'à la confirmation de livraison par le destinataire.",
      },
      {
        q: 'Quand est-ce que je suis payé en tant que voyageur ?',
        a: 'Le paiement est libéré dès que le destinataire confirme la réception du colis. Les fonds sont ensuite virés sur votre compte bancaire sous 3 à 5 jours ouvrés.',
      },
      {
        q: 'Que faire en cas de problème de paiement ?',
        a: "Si vous rencontrez un problème avec un paiement (retard, montant incorrect, etc.), utilisez l'onglet Demande d'assistance ci-dessus en sélectionnant le type « Problème de paiement ». Notre équipe vous répondra dans les plus brefs délais.",
      },
    ],
  },
  {
    title: 'Sécurité et confiance',
    questions: [
      {
        q: 'Comment les utilisateurs sont-ils vérifiés ?',
        a: "Chaque utilisateur peut effectuer une vérification d'identité (KYC) en soumettant une pièce d'identité officielle. Les profils vérifiés affichent un badge de confiance visible par tous les membres.",
      },
      {
        q: 'Comment signaler un comportement suspect ?',
        a: "Utilisez l'onglet Demande d'assistance ci-dessus en sélectionnant le type « Signalement ». Décrivez la situation de manière détaillée. Toutes les signalements sont traités de façon confidentielle.",
      },
      {
        q: 'Mes données personnelles sont-elles protégées ?',
        a: 'Oui. Sendbox traite vos données conformément au RGPD. Vos coordonnées ne sont jamais partagées publiquement. Pour en savoir plus, consultez notre Politique de confidentialité.',
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
    label: 'Problème de paiement',
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
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-sm font-medium hover:bg-muted/60 transition-colors">
        <span>{q}</span>
        <IconChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4 pt-1">
        <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
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
          className="rounded-xl border bg-card overflow-hidden"
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
                  'flex items-center gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors',
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
