'use client'

import { useWatch, Control, Controller, FieldErrors } from 'react-hook-form'
import { LOCATIONS } from '@/lib/shared/constants/locations'

interface LocationSelectsProps {
  prefix: 'departure' | 'arrival'
  label: string
  control: Control<any>
  errors?: {
    country?: { message?: string }
    city?: { message?: string }
  }
}

export function LocationSelects({ prefix, label, control, errors }: LocationSelectsProps) {
  const country = useWatch({ control, name: `${prefix}_country` }) ?? ''

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{label}</legend>

      <Controller
        control={control}
        name={`${prefix}_country`}
        rules={{ required: 'Pays requis' }}
        render={({ field }) => (
          <select
            {...field}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Pays…</option>
            {Object.entries(LOCATIONS).map(([code, { label: countryLabel }]) => (
              <option key={code} value={code}>
                {countryLabel}
              </option>
            ))}
          </select>
        )}
      />
      {errors?.country?.message && (
        <p className="text-sm text-destructive" role="alert">
          {errors.country.message}
        </p>
      )}

      <Controller
        control={control}
        name={`${prefix}_city`}
        rules={{ required: 'Ville requise' }}
        render={({ field }) => (
          <select
            {...field}
            disabled={!country}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-40"
          >
            <option value="">Ville…</option>
            {(LOCATIONS[country]?.cities ?? []).map(city => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        )}
      />
      {errors?.city?.message && (
        <p className="text-sm text-destructive" role="alert">
          {errors.city.message}
        </p>
      )}
    </fieldset>
  )
}
