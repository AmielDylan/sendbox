'use client'

import { IconMoon, IconSun } from '@tabler/icons-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { setTheme, theme, resolvedTheme } = useTheme()
  const isDark =
    theme === 'dark' ||
    (!theme && resolvedTheme === 'dark') ||
    resolvedTheme === 'dark'

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn('h-8 w-8', className)}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label="Basculer le thème"
    >
      <IconSun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <IconMoon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
