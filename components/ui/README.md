# Composants UI Sendbox

Ce dossier contient tous les composants UI basés sur [Shadcn/ui](https://ui.shadcn.com) et personnalisés pour Sendbox.

## 🎨 Charte Graphique

- **Couleur principale** : `#0d5554` (vert foncé)
- **Couleur secondaire** : `#f0f4f4` (gris clair)
- **Police** : Inter (via `next/font`)
- **Espacement de base** : 8px

## 📦 Composants Disponibles

### Composants Shadcn/UI

- `Button` - Boutons avec variantes (default, outline, ghost, etc.)
- `Input` - Champs de saisie
- `Card` - Cartes de contenu
- `Badge` - Badges et étiquettes
- `Avatar` - Avatars utilisateurs
- `Dialog` - Modales
- `Toast` (via Sonner) - Notifications toast
- `DropdownMenu` - Menus déroulants
- `Tabs` - Onglets
- `Form` - Formulaires avec react-hook-form + zod
- `Select` - Sélecteurs
- `Calendar` - Calendrier
- `Checkbox` - Cases à cocher
- `Label` - Labels de formulaire
- `Sheet` - Panneaux latéraux
- `Separator` - Séparateurs

### Composants Custom Sendbox

- `LoadingSpinner` - Spinner de chargement
- `PageHeader` - En-tête de page avec breadcrumbs

## 🚀 Utilisation

### Import depuis l'index

```tsx
import { Button, Card, PageHeader } from '@/components/ui'
```

### Import direct

```tsx
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
```

## 📝 Exemples

### Bouton

```tsx
import { Button } from '@/components/ui'

<Button variant="default">Cliquer</Button>
<Button variant="outline">Annuler</Button>
<Button variant="ghost">Action</Button>
```

### Page Header avec Breadcrumbs

```tsx
import { PageHeader } from '@/components/ui'
;<PageHeader
  title="Mon titre"
  description="Description de la page"
  breadcrumbs={[
    { label: 'Accueil', href: '/' },
    { label: 'Section', href: '/section' },
    { label: 'Page actuelle' },
  ]}
  actions={<Button>Action</Button>}
/>
```

### Loading Spinner

```tsx
import { LoadingSpinner } from '@/components/ui'
;<LoadingSpinner size="md" variant="primary" />
```

## ♿ Accessibilité

Tous les composants respectent les standards WCAG AA :

- **Contraste minimum** : 4.5:1 pour le texte
- **Focus visible** : Tous les éléments interactifs ont un focus visible
- **Labels ARIA** : Tous les boutons iconiques ont des labels
- **Navigation clavier** : Complète sur tous les composants

## 🎯 Bonnes Pratiques

1. **Utilisez les variantes** : Préférez les variantes existantes plutôt que de créer de nouveaux styles
2. **Composants accessibles** : Toujours inclure les attributs ARIA nécessaires
3. **Responsive** : Tous les composants sont responsive par défaut
4. **Dark mode** : Supporté automatiquement via les variables CSS

## 🔧 Personnalisation

Pour personnaliser les couleurs, modifiez les variables CSS dans `app/globals.css` :

```css
:root {
  --primary: #0d5554;
  --secondary: #f0f4f4;
  /* ... */
}
```

## 📚 Documentation

- [Shadcn/ui Documentation](https://ui.shadcn.com)
- [Radix UI Primitives](https://www.radix-ui.com)
- [Tailwind CSS](https://tailwindcss.com)








