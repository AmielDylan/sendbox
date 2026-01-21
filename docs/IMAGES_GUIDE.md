# Guide d'Intégration des Images - Sendbox

## 🎯 Objectif

Ce guide vous aide à trouver, télécharger et intégrer des images libres de droits qui correspondent à l'identité visuelle de Sendbox (palette terracotta/deep blue/warm gold).

---

## 📚 Sources d'Images Gratuites

### Plateformes Recommandées (100% Gratuites)

| Plateforme | Images Disponibles | Attribution Requise | Qualité |
|------------|-------------------|---------------------|---------|
| [Unsplash](https://unsplash.com) | 500+ luggage/travel | Non | ⭐⭐⭐⭐⭐ |
| [Pexels](https://www.pexels.com) | 2,000+ delivery | Non | ⭐⭐⭐⭐⭐ |
| [Pixabay](https://pixabay.com) | 900+ bagages | Non | ⭐⭐⭐⭐ |
| [Shopify Burst](https://www.shopify.com/stock-photos) | Shipping optimisé | Non | ⭐⭐⭐⭐ |

---

## 🎨 Images par Section

### 1. Hero Section

**Objectif:** Image de fond subtile avec tons chauds

**Recherches Unsplash:**
- `suitcase warm colors`
- `luggage sunset`
- `travel bag golden hour`
- `african luggage modern`

**Critères:**
- Tons chauds (orange, terracotta, or)
- Lumière naturelle/dorée
- Arrière-plan flou pour overlay texte
- Résolution: 1920×1080 minimum

**Code d'implémentation:**

```tsx
// app/page.tsx - Section Hero
<section className="relative overflow-hidden py-24 lg:py-32">
  {/* Background image avec overlay */}
  <div className="absolute inset-0 z-0">
    <Image
      src="/images/hero/luggage-warm-bg.jpg"
      alt=""
      fill
      priority
      className="object-cover opacity-15 blur-sm"
    />
    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20" />
  </div>

  {/* Contenu existant */}
  <div className="relative z-10 container-wide">
    {/* ... votre contenu hero ... */}
  </div>
</section>
```

---

### 2. Features Cards

**Objectif:** 4 images pour illustrer les features (Économique, Rapide, Sécurisé, Communauté)

#### Feature 1: Économique

**Recherches:**
- Pexels: `affordable shipping package`
- Unsplash: `money savings delivery`
- Pixabay: `budget friendly package`

**Mood:** Économies, accessibilité, value

#### Feature 2: Rapide

**Recherches:**
- Unsplash: `express delivery airplane`
- Pexels: `fast shipping speed`
- Pixabay: `quick delivery service`

**Mood:** Vitesse, efficacité, mouvement

#### Feature 3: Sécurisé

**Recherches:**
- Unsplash: `secure package lock`
- Pexels: `trust handshake delivery`
- Pixabay: `safety insurance shipping`

**Mood:** Confiance, protection, sécurité

#### Feature 4: Communauté

**Recherches:**
- Unsplash: `diverse travelers community`
- Pexels: `people connecting airport`
- Pixabay: `friends travel together`

**Mood:** Connexion, partage, diversité

**Code d'implémentation:**

```tsx
// app/page.tsx - Features Section
const features = [
  {
    title: "Économique",
    description: "Jusqu'à 60% moins cher que les services traditionnels",
    image: "/images/features/economique.jpg",
    icon: IconCurrencyDollar,
  },
  {
    title: "Rapide",
    description: "Livraison sous 24-48h entre la France et le Bénin",
    image: "/images/features/rapide.jpg",
    icon: IconRocket,
  },
  {
    title: "Sécurisé",
    description: "Vérification des voyageurs et assurance incluse",
    image: "/images/features/securise.jpg",
    icon: IconShieldCheck,
  },
  {
    title: "Communauté",
    description: "Rejoignez des milliers d'utilisateurs satisfaits",
    image: "/images/features/communaute.jpg",
    icon: IconUsers,
  },
]

// Dans le JSX
{features.map((feature, idx) => (
  <Card key={idx} elevation="elevated" className="overflow-hidden group">
    {/* Image header avec gradient overlay */}
    <div className="relative h-56 overflow-hidden">
      <Image
        src={feature.image}
        alt={feature.title}
        width={400}
        height={300}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      {/* Gradient pour lisibilité */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Icon overlay en bas à gauche */}
      <div className="absolute bottom-4 left-4 p-3 rounded-xl bg-white/95 backdrop-blur-sm shadow-lg">
        <feature.icon className="h-6 w-6 text-primary" />
      </div>
    </div>

    <CardHeader>
      <CardTitle className="font-heading">{feature.title}</CardTitle>
      <CardDescription>{feature.description}</CardDescription>
    </CardHeader>
  </Card>
))}
```

---

### 3. Testimonials Section (à ajouter)

**Objectif:** Portraits de clients satisfaits (diversité Europe-Afrique)

**Recherches:**
- Unsplash: `portrait happy customer`
- Pexels: `african woman smiling professional`
- Unsplash: `european man satisfied portrait`
- Pexels: `diverse people headshots`

**Critères:**
- Portraits naturels, souriants
- Fond neutre ou légèrement flou
- Éclairage professionnel
- Format: Carré ou portrait
- Diversité ethnique

**Code d'implémentation:**

```tsx
// Nouvelle section à ajouter dans app/page.tsx
<section className="py-16 md:py-24 bg-muted/30">
  <div className="container-wide">
    <div className="text-center mb-12">
      <h2 className="font-heading text-3xl md:text-4xl mb-4">
        Ils nous font confiance
      </h2>
      <p className="text-muted-foreground max-w-2xl mx-auto">
        Découvrez les témoignages de nos utilisateurs entre l'Europe et l'Afrique
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {testimonials.map((testimonial, idx) => (
        <Card key={idx} elevation="sm" className="p-6">
          <div className="flex items-center gap-4 mb-4">
            {/* Photo client */}
            <div className="relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-primary/20">
              <Image
                src={testimonial.photo}
                alt={testimonial.name}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <p className="font-semibold">{testimonial.name}</p>
              <p className="text-sm text-muted-foreground">{testimonial.location}</p>
            </div>
          </div>

          {/* Étoiles */}
          <div className="flex gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <IconStar key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            ))}
          </div>

          {/* Témoignage */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {testimonial.text}
          </p>
        </Card>
      ))}
    </div>
  </div>
</section>

// Data
const testimonials = [
  {
    name: "Aminata Diallo",
    location: "Cotonou, Bénin",
    photo: "/images/testimonials/client-1.jpg",
    text: "Service excellent ! J'ai reçu mon colis en 48h depuis Paris. Très économique et fiable.",
  },
  {
    name: "Pierre Dubois",
    location: "Paris, France",
    photo: "/images/testimonials/client-2.jpg",
    text: "Une solution innovante qui facilite l'envoi de colis. Je recommande vivement !",
  },
  {
    name: "Koffi Mensah",
    location: "Lille, France",
    photo: "/images/testimonials/client-3.jpg",
    text: "Parfait pour envoyer des cadeaux à ma famille au Bénin. Interface simple et efficace.",
  },
]
```

---

### 4. Trust Badges Section

**Objectif:** Icônes/images pour renforcer la confiance

**Recherches:**
- Pixabay: `verified badge icon`
- Pexels: `security shield`
- Unsplash: `5 star rating`
- Pixabay: `ssl certificate`

**Alternative:** Utiliser des icônes Tabler (déjà installées)

```tsx
// Section Trust - Utiliser icônes au lieu d'images
<section className="py-12 border-y bg-muted/20">
  <div className="container-wide">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
      <div className="space-y-2">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-primary/10">
            <IconShieldCheck className="h-8 w-8 text-primary" />
          </div>
        </div>
        <p className="font-semibold">100% Sécurisé</p>
        <p className="text-sm text-muted-foreground">Paiements protégés</p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-accent/10">
            <IconStar className="h-8 w-8 text-accent fill-accent" />
          </div>
        </div>
        <p className="font-semibold">4.8/5 Avis</p>
        <p className="text-sm text-muted-foreground">+500 utilisateurs</p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-secondary/10">
            <IconClock className="h-8 w-8 text-secondary" />
          </div>
        </div>
        <p className="font-semibold">24-48h</p>
        <p className="text-sm text-muted-foreground">Livraison rapide</p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-success/10">
            <IconCheck className="h-8 w-8 text-success" />
          </div>
        </div>
        <p className="font-semibold">Garantie</p>
        <p className="text-sm text-muted-foreground">Satisfait ou remboursé</p>
      </div>
    </div>
  </div>
</section>
```

---

### 5. Backgrounds Décoratifs

**Objectif:** Textures/patterns subtils pour sections alternées

**Recherches:**
- Unsplash: `terracotta texture minimal`
- Pexels: `warm gradient abstract`
- Unsplash: `blue ocean waves minimal`
- Pixabay: `sand texture africa`

**Usage:**

```tsx
// Section avec background décoratif
<section className="relative py-16 md:py-24 overflow-hidden">
  {/* Background texture */}
  <div className="absolute inset-0 z-0">
    <Image
      src="/images/backgrounds/terracotta-texture.jpg"
      alt=""
      fill
      className="object-cover opacity-5"
    />
  </div>

  {/* Contenu */}
  <div className="relative z-10 container-wide">
    {/* ... */}
  </div>
</section>
```

---

## 📥 Workflow de Téléchargement

### Étape 1: Préparer la structure de dossiers

```bash
mkdir -p public/images/hero
mkdir -p public/images/features
mkdir -p public/images/testimonials
mkdir -p public/images/backgrounds
mkdir -p public/images/trust-badges
```

### Étape 2: Télécharger depuis Unsplash

1. Aller sur [Unsplash.com](https://unsplash.com)
2. Rechercher le terme (ex: "suitcase warm colors")
3. **Filtrer par couleur:** Cliquer sur "Filters" → Sélectionner "Orange" ou "Red" pour tons chauds
4. Cliquer sur l'image souhaitée
5. Cliquer "Download free" → Choisir taille "Large" (1920px)
6. Renommer le fichier de façon descriptive: `hero-luggage-sunset.jpg`

### Étape 3: Télécharger depuis Pexels

1. Aller sur [Pexels.com](https://www.pexels.com)
2. Rechercher le terme
3. Cliquer sur l'image → "Free Download" → Taille "Large"
4. Renommer et organiser

### Étape 4: Optimiser les images

Next.js optimise automatiquement les images avec le composant `<Image>`, mais vous pouvez pré-optimiser:

```bash
# Installer sharp (normalement déjà inclus avec Next.js)
npm install sharp

# Les images seront automatiquement optimisées lors du build
npm run build
```

### Étape 5: Placer dans les bons dossiers

```
public/images/
├── hero/
│   ├── luggage-warm-bg.jpg          (1920×1080, tons chauds)
│   └── traveler-sunset.jpg          (Alternative)
├── features/
│   ├── economique.jpg               (800×600, thème money/value)
│   ├── rapide.jpg                   (800×600, thème speed)
│   ├── securise.jpg                 (800×600, thème trust/lock)
│   └── communaute.jpg               (800×600, thème people)
├── testimonials/
│   ├── client-1.jpg                 (400×400, portrait femme africaine)
│   ├── client-2.jpg                 (400×400, portrait homme européen)
│   └── client-3.jpg                 (400×400, portrait diversité)
└── backgrounds/
    ├── terracotta-texture.jpg       (1920×1080, texture subtile)
    └── blue-abstract.jpg            (1920×1080, minimal)
```

---

## 🎨 Guide de Sélection: Filtres de Couleur

### Sur Unsplash

Quand vous recherchez, utilisez les filtres de couleur:

- **Orange/Red** → Pour thème terracotta/Africa/chaleur
- **Blue** → Pour thème ocean/voyage/Europe
- **Yellow** → Pour thème sunset/gold/connexion
- **Neutral/Gray** → Pour backgrounds subtils

**Comment filtrer:**
1. Entrer recherche (ex: "luggage")
2. Cliquer sur "Filters" en haut à droite
3. Sélectionner "Color" → Choisir la couleur souhaitée
4. Les résultats sont filtrés automatiquement

### Sur Pexels

Pexels a aussi un filtre de couleur:

1. Rechercher terme
2. Cliquer sur icône de filtre
3. Sélectionner palette de couleur
4. Parcourir résultats filtrés

---

## ✅ Checklist Qualité Images

Avant de télécharger une image, vérifier:

- [ ] **Résolution:** Minimum 1920×1080 pour hero, 800×600 pour features
- [ ] **Format:** JPG pour photos, PNG si transparence nécessaire
- [ ] **Couleurs:** Correspond à palette Sendbox (terracotta/blue/gold)
- [ ] **Composition:** Espace négatif pour overlay de texte si nécessaire
- [ ] **Qualité:** Nette, bien exposée, professionnelle
- [ ] **Licence:** 100% gratuite et libre de droits commerciaux
- [ ] **Pertinence:** Illustre bien le concept (covalisage, voyage, confiance)

---

## 🚀 Implémentation Recommandée

### Ordre de Priorité

1. **Hero background** - Impact immédiat sur landing page
2. **Features images** - Illustre value proposition
3. **Testimonials** - Renforce confiance
4. **Backgrounds décoratifs** - Polish final

### Performance

Next.js optimise automatiquement avec le composant `Image`:

```tsx
import Image from 'next/image'

// Bon ✅
<Image
  src="/images/hero/luggage.jpg"
  alt="Description"
  width={1920}
  height={1080}
  priority // Pour images above-the-fold
  className="object-cover"
/>

// Mauvais ❌
<img src="/images/hero/luggage.jpg" alt="Description" />
```

**Avantages:**
- Lazy loading automatique
- Responsive images (srcset)
- Formats modernes (WebP, AVIF) si supportés
- Optimisation taille fichier

---

## 📞 Support

Si vous avez des questions ou besoin d'aide pour trouver des images spécifiques, consultez:

- [Unsplash Help](https://help.unsplash.com)
- [Pexels Help](https://www.pexels.com/faq/)
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)

---

## 🎯 Résumé Rapide

**Meilleures sources:**
- Unsplash (qualité premium)
- Pexels (grande variété)
- Shopify Burst (shipping)

**Termes de recherche clés:**
- `suitcase warm colors`
- `luggage sunset`
- `international delivery`
- `african travel`
- `trust handshake`
- `diverse community`

**Palette de filtres:**
- Orange/Red (terracotta)
- Blue (ocean)
- Yellow (gold)

**Résolution minimum:**
- Hero: 1920×1080
- Features: 800×600
- Testimonials: 400×400

Bon téléchargement ! 🚀
