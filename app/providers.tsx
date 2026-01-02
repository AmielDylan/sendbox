/**
 * Providers pour l'application
 */

'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { useEffect, useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: true, // Activer le refetch au focus pour améliorer la réactivité
          },
        },
      })
  )

  // Écouter l'événement auth-change globalement
  useEffect(() => {
    const handleAuthChange = () => {
      console.log('Global auth change - invalidating all queries')
      // Invalider toutes les queries pour forcer le rafraîchissement
      queryClient.invalidateQueries()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('auth-change', handleAuthChange)
      return () => window.removeEventListener('auth-change', handleAuthChange)
    }
  }, [queryClient])

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ThemeProvider>
  )
}











