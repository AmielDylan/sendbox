# Sendbox V1 — Prompts image de production

Ces prompts produisent une famille cohérente, honnête sur la V1 et réutilisable pour de futurs corridors.

## Grammaire commune

**Photos humaines** : photographie éditoriale réaliste, premium accessible, textures naturelles, netteté franche, lumière du jour neutre à légèrement chaude. Adultes, diversité diaspora et voyageurs internationaux, tenues naturelles, aucun uniforme.

**Empty states** : nature morte éditoriale réaliste sur fond ivoire très clair, ombre douce, groupe compact, marges généreuses, lisible à 144 px.

**Palette** : blanc cassé, kraft, graphite, vert profond discret, bleu encre mineur. Aucun drapeau ou code couleur national dominant.
**Promesse** : mise en relation entre particuliers vérifiés ; aucun signe d'assurance, escrow, garantie de transport ou paiement au voyageur par Sendbox.

### Negative prompt commun

Pas de texte lisible, watermark, marque, donnée personnelle, passeport réel, argent, carte bancaire, terminal de paiement, cadenas financier, coffre, bouclier d'assurance, chèque, médicament, arme, objet interdit, uniforme de livreur, camion, comptoir de compagnie, monument cliché, scène policière, profondeur de champ extrême, peau plastique, 3D brillante, cartoon enfantin, mains déformées ou visage coupé.

## P0 — Hero remise de colis

**Cible** : `hero-handoff-airport-01.png`, paysage 16:9 ou 21:9, recadrable en 4:5.

```text
Use case: photorealistic-natural
Asset type: Sendbox landing-page hero
Primary request: show a clear voluntary handoff of one small clean sealed parcel between two private individuals before a trip.
Scene/backdrop: bright contemporary international airport concourse, calm daylight, no identifiable airline, airport or country.
Subject: adult sender and adult traveler from diverse international backgrounds; traveler has one cabin suitcase; both hold the parcel naturally; neutral smartphone optional with abstract unreadable interface.
Style/medium: candid editorial lifestyle photography, realistic and premium-accessible, not glossy advertising.
Composition/framing: extra-wide; subjects and parcel in the right third; 45% clean negative space on the left for headline and CTAs; full heads and hands; parcel is the focus; mobile crop keeps both people, parcel and suitcase.
Lighting/mood: soft natural daylight, calm confidence, moderate contrast behind the future copy.
Color palette: warm off-white, graphite, restrained deep green and ink-blue details.
Constraints: peer-to-peer meeting only; no implication that Sendbox transports, insures, guarantees or pays; no readable text or logos.
Avoid: apply the common negative prompt.
```

## P0 — Empty aucun colis

**Cible** : `empty-packages-01.png`, 1:1 ou 4:3.

```text
Use case: product-mockup
Asset type: compact dashboard empty state for no active package
Primary request: one small clean sealed kraft parcel beside one neutral modern smartphone.
Scene/backdrop: seamless warm ivory studio surface, subtle contact shadow, no horizon line.
Style/medium: realistic editorial still life, tactile cardboard and matte phone, quiet premium restraint.
Composition/framing: centered compact pair, generous padding, no crop, immediately legible at 144 px.
Lighting/mood: soft daylight, calm and inviting, never lonely or error-like.
Constraints: blank screen and label; exactly two objects; no travel, payment, insurance or delivery-company cue.
Avoid: common negative prompt; no warning sign, red, confetti or van.
```

## P0 — Empty aucun trajet

**Cible** : `empty-trips-01.png`, 1:1 ou 4:3.

```text
Use case: product-mockup
Asset type: compact dashboard empty state for no published trip
Primary request: one unbranded cabin suitcase beside one small sealed kraft parcel and one generic blank travel-document sleeve.
Scene/backdrop: seamless warm ivory studio setting with minimal soft shadow.
Style/medium: realistic editorial still life, clean but tactile, premium-accessible.
Composition/framing: centered balanced group, suitcase handle or travel form obvious, generous padding, legible at 144 px.
Lighting/mood: natural soft daylight, readiness and possibility, no urgency.
Color palette: graphite or stone suitcase, kraft parcel, off-white background, restrained ink-blue detail.
Constraints: no destination, passport data, flag, airline, logo or transport-company cue.
Avoid: common negative prompt; no airplane model dominating the scene.
```

## P0 — Empty aucune demande

**Cible** : `empty-requests-01.png`, 1:1 ou 4:3.

```text
Use case: product-mockup
Asset type: compact dashboard empty state for no incoming package request
Primary request: neutral smartphone with two abstract empty cards beside a parcel tag and a simple route card with two unlabelled dots.
Scene/backdrop: seamless warm ivory studio surface.
Style/medium: realistic editorial paper-and-phone still life, not an app screenshot or 3D illustration.
Composition/framing: simple compact arrangement, generous margin, no more than four objects, legible at 144 px.
Lighting/mood: soft and optimistic, quiet waiting rather than failure.
Constraints: abstract shapes only; no text, names, price or notification count.
Avoid: common negative prompt; no red badge or ringing effect.
```

## P0 — KYC en attente

**Cible** : `empty-kyc-pending-01.png`, 1:1 ou 4:3.

```text
Use case: product-mockup
Asset type: compact KYC pending state
Primary request: neutral smartphone, one generic identity-document silhouette with blank fields, and a small understated clock token.
Scene/backdrop: seamless warm ivory studio surface, subtle grounding shadow.
Style/medium: realistic editorial still life, precise and reassuring administrative tone.
Composition/framing: centered compact arrangement, generous padding, legible at 144 px.
Lighting/mood: clean daylight, calm, no urgency or success celebration.
Color palette: off-white, graphite, ink-blue information accent, restrained amber clock detail.
Constraints: no shield, approval check, guarantee seal, readable data, face, fingerprint, emblem or promised duration.
Avoid: apply the common negative prompt.
```

## P1 — Déclaration colis

**Cible** : `trust-package-declaration-01.png`, 3:2.

```text
Use case: photorealistic-natural
Asset type: landing trust section about package-content declaration
Primary request: an adult carefully checks and declares the ordinary contents of one open parcel on a smartphone.
Scene/backdrop: bright home table or calm shared workspace.
Subject: hands, parcel and phone central; contents limited to folded clothing, paperback book and one sealed ordinary item.
Composition/framing: medium close shot from a 35-degree overhead angle, every item visible, mobile-safe crop.
Lighting/mood: natural daylight, transparency and care rather than surveillance.
Constraints: abstract phone UI; declaration only, no approval, insurance or guarantee.
Avoid: common negative prompt; no medicine, money, branded electronics or luxury item.
```

## P1 — Preuve photo de remise

**Cible** : `proof-handoff-photo-01.png`, 3:2.

```text
Use case: photorealistic-natural
Asset type: explainer section about handoff photo evidence
Primary request: two consenting adults make a simple photo record of a sealed parcel at handoff.
Scene/backdrop: bright public meeting area near a station or airport entrance, no company signs.
Subject: one person holds the parcel while the other frames it with a smartphone camera.
Composition/framing: parcel and phone visible, medium shot, complete plausible hands, responsive margin.
Lighting/mood: cooperative daylight, matter-of-fact, never suspicious.
Constraints: blurred abstract camera preview, no face or data on screen; evidence only, no guarantee cue.
Avoid: common negative prompt; no CCTV, police framing or dramatic flash.
```

## P1 — Livraison confirmée

**Cible** : `proof-delivery-confirmed-01.png`, 3:2.

```text
Use case: photorealistic-natural
Asset type: explainer section about confirming receipt
Primary request: calm final handoff of an intact sealed parcel while the recipient records receipt on a neutral smartphone.
Scene/backdrop: bright residential lobby or simple home entrance, globally neutral.
Composition/framing: medium shot, parcel central, phone secondary, complete hands and faces, mobile-safe.
Lighting/mood: warm natural daylight, relief without exaggerated celebration.
Constraints: receipt record only; no refund, payout, insurance or guarantee symbol.
Avoid: common negative prompt; no confetti, cash, payment screen or courier uniform.
```

## P1 — Avis et réputation

**Cible** : `trust-reputation-01.png`, 3:2.

```text
Use case: product-mockup
Asset type: trust section about peer reputation
Primary request: tabletop composition with a neutral profile card, three abstract review cards and a small parcel tag.
Scene/backdrop: warm ivory surface with real paper texture.
Style/medium: realistic paper-and-phone still life, not a copied app interface.
Composition/framing: profile card primary, review cards clearly spaced, no more than five simple star shapes.
Lighting/mood: calm, credible and cumulative.
Constraints: no names, numbers, comments, logo, certification seal or perfect-score claim.
Avoid: common negative prompt; no oversized five-star burst or social reactions.
```

## P2 — Litige et signalement

**Cible** : `trust-dispute-report-01.png`, 3:2.

```text
Use case: product-mockup
Asset type: help-center visual for reporting a problem
Primary request: neutral smartphone beside an evidence folder with a blank parcel-photo card and simple timeline card.
Scene/backdrop: clean warm ivory desk, controlled and uncluttered.
Style/medium: realistic editorial still life, administrative and non-legal.
Composition/framing: phone and folder equally clear, generous negative space, no distressed person.
Lighting/mood: neutral daylight, calm resolution without alarm.
Color palette: off-white, graphite, ink blue and one restrained danger-red marker.
Constraints: no compensation, court, police, insurance, refund, money or guaranteed resolution.
Avoid: common negative prompt; no dramatic broken parcel, warning tape or gavel.
```

## Contrôle après génération

1. L'action est-elle comprise en moins de deux secondes ?
2. Le visuel reste-t-il vrai hors du corridor France–Bénin ?
3. Le crop mobile conserve-t-il le geste, pas seulement un visage ?
4. Un symbole peut-il être lu comme garantie, assurance ou paiement ?
5. Mains, écrans, documents et étiquettes sont-ils plausibles et sans donnée lisible ?
6. L'image fonctionne-t-elle dans une UI claire sans filtre lourd ?
