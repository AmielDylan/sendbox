# Implémentation du Composant Calendar Shadcn/UI

## Vue d'ensemble

Ce document décrit l'implémentation du composant calendrier de base utilisant shadcn/ui dans notre projet Next.js.

## Composant de Base

### CalendarDemo

Le composant `CalendarDemo` fournit une implémentation simple du calendrier avec sélection de date unique.

```tsx
"use client"

import * as React from "react"

import { Calendar } from "@/components/ui/calendar"

export function CalendarDemo() {
  const [date, setDate] = React.useState<Date | undefined>(new Date())

  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      className="rounded-md border shadow-sm"
      captionLayout="dropdown"
    />
  )
}
```

### Emplacement du fichier

- **Chemin**: `components/shared/calendar-demo.tsx`
- **Type**: Composant React client-side

## Utilisation

### Import

```tsx
import { CalendarDemo } from "@/components/shared/calendar-demo"
```

### Dans le JSX

```tsx
<CalendarDemo />
```

## Fonctionnalités

- ✅ Sélection de date unique
- ✅ Navigation par dropdown (mois/année)
- ✅ Design responsive
- ✅ Accessibilité (Radix UI)
- ✅ Thème sombre/clair supporté

## Personnalisations Possibles

### Sélection de plage de dates

```tsx
import { type DateRange } from "react-day-picker"

const [dateRange, setDateRange] = React.useState<DateRange | undefined>()

<Calendar
  mode="range"
  selected={dateRange}
  onSelect={setDateRange}
  numberOfMonths={2}
/>
```

### Dates désactivées

```tsx
const disabledDates = [
  new Date(2026, 0, 25), // 25 janvier 2026
  { from: new Date(2026, 1, 1), to: new Date(2026, 1, 5) } // 1-5 février 2026
]

<Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
  disabled={disabledDates}
/>
```

### Plusieurs mois affichés

```tsx
<Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
  numberOfMonths={3}
/>
```

## Dépendances

Le composant utilise les dépendances suivantes (déjà installées) :

- `react-day-picker`: ^9.13.0
- `@radix-ui/react-*`: Composants Radix UI
- `lucide-react`: Icônes
- `date-fns`: Manipulation des dates

## Intégration dans les formulaires

Pour utiliser le calendrier dans un formulaire avec react-hook-form :

```tsx
import { useForm } from "react-hook-form"
import { Calendar } from "@/components/ui/calendar"

function DatePickerForm() {
  const { setValue, watch } = useForm()
  const selectedDate = watch("date")

  return (
    <Calendar
      mode="single"
      selected={selectedDate}
      onSelect={(date) => setValue("date", date)}
    />
  )
}
```

## Styles et Thèmes

Le calendrier hérite automatiquement du thème de l'application via Tailwind CSS et les variables CSS de shadcn/ui.

## Accessibilité

- Navigation au clavier supportée
- Lecteurs d'écran compatibles
- Indicateurs visuels clairs
- Conformité WCAG

## Tests

Pour tester le composant :

```tsx
// Dans un fichier de test
import { render, screen } from "@testing-library/react"
import { CalendarDemo } from "./calendar-demo"

test("renders calendar", () => {
  render(<CalendarDemo />)
  expect(screen.getByRole("grid")).toBeInTheDocument()
})
```

## Ressources Supplémentaires

- [Documentation shadcn/ui Calendar](https://ui.shadcn.com/docs/components/calendar)
- [react-day-picker Documentation](https://react-day-picker.js.org/)
- [Radix UI Primitives](https://www.radix-ui.com/)