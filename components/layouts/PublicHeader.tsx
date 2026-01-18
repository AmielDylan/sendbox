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

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, loading, signOut: authSignOut } = useAuth()
  const isLogin = pathname.startsWith('/login')
  const isRegister = pathname.startsWith('/register')
  const authPrimary = isLogin ? 'login' : isRegister ? 'register' : 'register'

  // Debug: logger l'état de l'utilisateur et du profil
  useEffect(() => {
    console.log('PublicHeader - Auth state:', {
      user: user?.id,
      profile: (profile as any)?.id,
      loading,
      hasAvatar: !!(profile as any)?.avatar_url,
      firstname: (profile as any)?.firstname,
      lastname: (profile as any)?.lastname
    })
  }, [user, profile, loading])

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

  const handleLogout = async () => {
    try {
      // Utiliser la fonction signOut du hook useAuth qui nettoie le cache
      await authSignOut()

      // Nettoyer le localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('current_user_id')
      }

      toast.success('Déconnexion réussie')

      // Rediriger vers la page de login
      router.push('/login')

      // Forcer un refresh complet après un court délai
      setTimeout(() => {
        router.refresh()
      }, 100)
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Erreur lors de la déconnexion')
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/70 relative">
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="container-wide flex h-16 items-center justify-between relative">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <Image
            src="/images/branding/logo.svg"
            alt="Sendbox - Covalisage international Europe-Afrique"
            width={145}
            height={29}
            priority
            className="h-7 w-auto sm:h-8 transition-opacity group-hover:opacity-80 dark:hidden"
            style={{ maxWidth: '145px' }}
          />
          <Image
            src="/images/branding/logo-white.svg"
            alt="Sendbox - Covalisage international Europe-Afrique"
            width={145}
            height={29}
            priority
            className="hidden h-7 w-auto sm:h-8 transition-opacity group-hover:opacity-80 dark:block"
            style={{ maxWidth: '145px' }}
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary',
                  isActive(item.href)
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
          <ClientOnly fallback={
            <Button variant="ghost" disabled>
              <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
              Chargement...
            </Button>
          }>
            {!user ? (
              <>
                <Button asChild variant={authPrimary === 'login' ? 'default' : 'outline'}>
                  <Link href="/login">
                    Se connecter
                  </Link>
                </Button>
                <Button asChild variant={authPrimary === 'register' ? 'default' : 'outline'}>
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
                    className="relative rounded-full"
                    aria-label="Menu utilisateur"
                  >
                    <Avatar className="h-8 w-8">
                      {(profile as any)?.avatar_url && (
                        <AvatarImage
                          src={(profile as any).avatar_url}
                          alt={displayName}
                        />
                      )}
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
                    <Link href="/profil">Mon profil</Link>
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

        {/* Mobile Menu */}
        <div className="md:hidden">
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
                            ? 'bg-accent text-accent-foreground'
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
                          variant={authPrimary === 'login' ? 'default' : 'outline'}
                          className="w-full"
                        >
                          <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                            Se connecter
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant={authPrimary === 'register' ? 'default' : 'outline'}
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
                          <Avatar className="h-8 w-8">
                            {(profile as any)?.avatar_url && (
                              <AvatarImage
                                src={(profile as any).avatar_url}
                                alt={displayName}
                              />
                            )}
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
                          <Link href="/profil" onClick={() => setMobileMenuOpen(false)}>
                            Mon profil
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50"
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
