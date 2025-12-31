'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  IconLayoutDashboard,
  IconMessage,
  IconPackage,
  IconSettings,
  IconBell,
  IconMenu2,
  IconX,
  IconChevronRight,
  IconLoader2,
  IconShield,
  IconCheck,
  IconClock,
  IconAlertCircle,
} from '@tabler/icons-react'
import { cn } from "@/lib/utils"
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { NotificationDropdown } from '@/components/features/notifications/NotificationDropdown'
import { useAuth } from '@/hooks/use-auth'
import { isFeatureEnabled } from "@/lib/shared/config/features"
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { ClientOnly } from '@/components/ui/client-only'

interface DashboardLayoutProps {
  children: React.ReactNode
}

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

const navItems: NavItem[] = [
  {
    title: 'Tableau de bord',
    href: '/dashboard',
    icon: IconLayoutDashboard,
  },
  {
    title: 'Messages',
    href: '/dashboard/messages',
    icon: IconMessage,
    // badge dynamique géré par useUnreadCount
  },
  {
    title: 'Annonces',
    href: '/dashboard/annonces',
    icon: IconPackage,
  },
  {
    title: 'Colis',
    href: '/dashboard/colis',
    icon: IconPackage,
  },
  {
    title: 'Réglages',
    href: '/dashboard/reglages',
    icon: IconSettings,
  },
]

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4 md:hidden">
        <ClientOnly>
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Ouvrir le menu">
                <IconMenu2 className="h-5 w-5" />
                <span className="sr-only">Ouvrir le menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
              <SidebarContent
                pathname={pathname}
                onNavigate={() => setSidebarOpen(false)}
              />
            </SheetContent>
          </Sheet>
        </ClientOnly>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">Sendbox</h1>
        </div>
        <HeaderActions />
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:left-0 md:border-r">
          <SidebarContent pathname={pathname} />
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:ml-64">
          {/* Desktop Header */}
          <header className="sticky top-0 z-40 hidden h-16 items-center gap-4 border-b bg-background px-6 md:flex">
            <div className="flex flex-1 items-center gap-4">
              <h1 className="text-lg font-semibold">Sendbox</h1>
            </div>
            <HeaderActions />
          </header>

          {/* Page Content */}
          <div className="p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}

function SidebarContent({
  pathname,
  onNavigate,
}: {
  pathname: string
  onNavigate?: () => void
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-semibold text-primary"
          onClick={onNavigate}
        >
          <IconPackage className="h-6 w-6" />
          <span>Sendbox</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4" aria-label="Navigation principale">
        {navItems.map(item => {
          const Icon = item.icon
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="flex-1">{item.title}</span>
              {item.badge && (
                <Badge variant="secondary" className="ml-auto">
                  {item.badge}
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="border-t p-4">
        <UserMenu />
      </div>
    </div>
  )
}

function HeaderActions() {
  return (
    <div className="flex items-center gap-2">
      <ClientOnly>
        <ThemeToggle />
      </ClientOnly>

      <ClientOnly>
        <NotificationDropdown />
      </ClientOnly>

      <ClientOnly>
        <UserMenu />
      </ClientOnly>
    </div>
  )
}

function UserMenu() {
  const router = useRouter()
  const { user, profile, loading, signOut: authSignOut } = useAuth()
  const [avatarError, setAvatarError] = useState(false)

  // Timeout après 3s si toujours en chargement
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        if (loading) {
          console.warn('Avatar loading timeout after 3s')
          setAvatarError(true)
        }
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [loading])

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

  // Si timeout atteint, afficher le fallback
  if (loading && !avatarError) {
    return (
      <div className="flex items-center gap-3">
        <IconLoader2 className="h-4 w-4 animate-spin" />
      </div>
    )
  }

  const displayName = profile
    ? `${(profile as any).firstname || ''} ${(profile as any).lastname || ''}`.trim() || 'Utilisateur'
    : 'Utilisateur'

  const initials = profile
    ? `${(profile as any).firstname?.[0] || ''}${(profile as any).lastname?.[0] || ''}`.toUpperCase() || 'U'
    : 'U'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-9 w-9 rounded-full focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Menu utilisateur"
        >
          <Avatar className="h-9 w-9">
            {!avatarError && (profile as any)?.avatar_url && (
              <AvatarImage
                src={(profile as any).avatar_url}
                alt={displayName}
                onError={() => setAvatarError(true)}
              />
            )}
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
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
            {/* Badge statut KYC - SEULEMENT si feature activée */}
            {isFeatureEnabled('KYC_ENABLED') && (profile as any)?.kyc_status === 'approved' && (
              <Badge variant="outline" className="w-fit text-green-600 border-green-600 mt-2">
                <IconCheck className="mr-1 h-3 w-3" />
                Vérifié
              </Badge>
            )}
            {isFeatureEnabled('KYC_ENABLED') && (profile as any)?.kyc_status === 'pending' && (
              <Badge variant="outline" className="w-fit text-yellow-600 border-yellow-600 mt-2">
                <IconClock className="mr-1 h-3 w-3" />
                Vérification en cours
              </Badge>
            )}
            {isFeatureEnabled('KYC_ENABLED') && (!(profile as any)?.kyc_status || (profile as any).kyc_status === 'rejected') && (
              <Badge variant="outline" className="w-fit text-muted-foreground mt-2">
                <IconAlertCircle className="mr-1 h-3 w-3" />
                Non vérifié
              </Badge>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* Lien rapide vers KYC si non approuvé - SEULEMENT si feature activée */}
        {isFeatureEnabled('KYC_ENABLED') && (profile as any)?.kyc_status !== 'approved' && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/reglages/kyc" className="cursor-pointer">
                <IconShield className="mr-2 h-4 w-4" />
                <span>Vérifier mon identité</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem asChild>
          <Link href="/dashboard/reglages" className="cursor-pointer">
            <IconSettings className="mr-2 h-4 w-4" />
            <span>Paramètres</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleLogout}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <IconX className="mr-2 h-4 w-4" />
          <span>Déconnexion</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
