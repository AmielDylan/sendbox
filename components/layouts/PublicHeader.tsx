'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { IconMenu2, IconSearch, IconLoader2, IconLayoutDashboard } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { ClientOnly } from '@/components/ui/client-only'
import { getAvatarUrl } from "@/lib/core/profile/utils"
import { isFeatureEnabled } from "@/lib/shared/config/features"

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, loading, signOut: authSignOut } = useAuth()
  const isLogin = pathname.startsWith('/login')
  const isRegister = pathname.startsWith('/register')
  const authPrimary = isLogin ? 'login' : isRegister ? 'register' : 'register'

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { label: 'Accueil', href: '/' },
    { label: 'Rechercher', href: '/recherche', icon: IconSearch },
  ]
  if (user) {
    navItems.push({ label: 'Dashboard', href: '/dashboard', icon: IconLayoutDashboard })
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const displayName = profile
    ? `${(profile as any).firstname || ''} ${(profile as any).lastname || ''}`.trim() || 'Utilisateur'
    : 'Utilisateur'

  const initials = profile
    ? `${(profile as any).firstname?.[0] || ''}${(profile as any).lastname?.[0] || ''}`.toUpperCase() || 'U'
    : 'U'
  const avatarUrl = getAvatarUrl(
    (profile as any)?.avatar_url || null,
    (profile as any)?.id || user?.id || displayName
  )
  const profileId = (profile as any)?.id || user?.id
  const profileLink = profileId ? `/profil/${profileId}` : '/dashboard/reglages/profil'
  const showKycLink = isFeatureEnabled('KYC_ENABLED') && (profile as any)?.kyc_status !== 'approved'

  const handleLogout = async () => {
    try {
      await authSignOut()
      if (typeof window !== 'undefined') {
        localStorage.removeItem('current_user_id')
      }
      toast.success('Déconnexion réussie')
      router.push('/login')
      setTimeout(() => {
        router.refresh()
      }, 100)
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Erreur lors de la déconnexion')
    }
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-all duration-300",
        scrolled
          ? "bg-background/95 shadow-md backdrop-blur-xl supports-[backdrop-filter]:bg-background/80"
          : "bg-background/80 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-background/60"
      )}
    >
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 flex h-16 items-center justify-between relative">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <Image
            src="/images/branding/logo.svg"
            alt="Sendbox - Covalisage international Europe-Afrique"
            width={145}
            height={29}
            priority
            className="h-7 w-auto sm:h-8 transition-all duration-300 group-hover:scale-105 dark:hidden"
            style={{ maxWidth: '145px' }}
          />
          <Image
            src="/images/branding/logo-white.svg"
            alt="Sendbox - Covalisage international Europe-Afrique"
            width={145}
            height={29}
            priority
            className="hidden h-7 w-auto sm:h-8 transition-all duration-300 group-hover:scale-105 dark:block"
            style={{ maxWidth: '145px' }}
          />
        </Link>

        {/* Desktop Navigation & Actions */}
        <div className="hidden md:flex items-center gap-8">
          <nav className="flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-sm font-medium transition-all duration-200 relative',
                  isActive(item.href)
                    ? 'text-foreground after:absolute after:bottom-[-4px] after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="h-5 w-px bg-gradient-to-b from-transparent via-border to-transparent" />

          <div className="flex items-center gap-3">
            <ClientOnly fallback={
              <Button variant="ghost" disabled size="sm">
                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                Chargement...
              </Button>
            }>
              {!user ? (
                <>
                  <Button asChild variant="ghost" size="sm" className="hover:bg-accent">
                    <Link href="/login">
                      Se connecter
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200">
                    <Link href="/register">
                      S'inscrire
                    </Link>
                  </Button>
                </>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative rounded-full hover:scale-105 transition-transform duration-200"
                      aria-label="Menu utilisateur"
                    >
                      <Avatar className="h-9 w-9 ring-2 ring-primary/10">
                        <AvatarImage src={avatarUrl} alt={displayName} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{displayName}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email || 'email@example.com'}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">Tableau de bord</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={profileLink}>Mon profil</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {showKycLink && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/dashboard/reglages/kyc">
                            Vérifier mon identité
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/reglages">Paramètres</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-red-600 focus:text-red-600"
                    >
                      Se déconnecter
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </ClientOnly>
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Menu">
                <IconMenu2 className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
              <div className="flex flex-col gap-4 mt-8">
                <nav className="flex flex-col gap-2">
                  {navItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          isActive(item.href)
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        {Icon && <Icon className="h-5 w-5" />}
                        {item.label}
                      </Link>
                    )
                  })}
                </nav>
                <div className="border-t pt-4 flex flex-col gap-2">
                  <ClientOnly fallback={
                    <Button variant="outline" className="w-full" disabled>
                      <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                      Chargement...
                    </Button>
                  }>
                    {!user ? (
                      <>
                        <Button
                          asChild
                          variant="outline"
                          className="w-full"
                        >
                          <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                            Se connecter
                          </Link>
                        </Button>
                        <Button
                          asChild
                          className="w-full"
                        >
                          <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                            S'inscrire
                          </Link>
                        </Button>
                      </>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3 px-3 py-2">
                          <Avatar className="h-9 w-9 ring-2 ring-primary/10">
                            <AvatarImage src={avatarUrl} alt={displayName} />
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <p className="text-sm font-medium">{displayName}</p>
                            <p className="text-xs text-muted-foreground">{user?.email}</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button asChild variant="ghost" className="w-full justify-start">
                            <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                              Tableau de bord
                            </Link>
                          </Button>
                          <Button asChild variant="ghost" className="w-full justify-start">
                            <Link href={profileLink} onClick={() => setMobileMenuOpen(false)}>
                              Mon profil
                            </Link>
                          </Button>
                          {showKycLink && (
                            <Button asChild variant="ghost" className="w-full justify-start">
                              <Link href="/dashboard/reglages/kyc" onClick={() => setMobileMenuOpen(false)}>
                                Vérifier mon identité
                              </Link>
                            </Button>
                          )}
                          <Button asChild variant="ghost" className="w-full justify-start">
                            <Link href="/dashboard/reglages" onClick={() => setMobileMenuOpen(false)}>
                              Paramètres
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                            onClick={() => {
                              handleLogout()
                              setMobileMenuOpen(false)
                            }}
                          >
                            Se déconnecter
                          </Button>
                        </div>
                      </div>
                    )}
                  </ClientOnly>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
