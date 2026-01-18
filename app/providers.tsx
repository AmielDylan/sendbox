/**
 * Providers pour l'application
 * Mis à jour avec la configuration optimisée pour la cohérence des données
 */

'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { useState } from 'react'
import { createQueryClient } from '@/lib/shared/query/config'
import { OptimizedAuthProvider } from '@/components/providers/optimized-auth-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  // Utiliser la configuration optimisée
  const [queryClient] = useState(() => createQueryClient())

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <OptimizedAuthProvider>
          {children}
        </OptimizedAuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}












