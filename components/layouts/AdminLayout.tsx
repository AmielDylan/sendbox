/**
 * Layout pour les pages admin
 * Pattern responsive suivant DashboardLayout avec badge ADMIN
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  IconLayoutDashboard,
  IconUsers,
  IconFileCheck,
  IconSpeakerphone,
  IconPackage,
  IconAlertTriangle,
  IconCreditCard,
  IconMessageCircle,
  IconMenu2,
  IconLoader2,
  IconLogout,
  IconRosetteDiscountCheck,
  IconCheck,
} from '@tabler/icons-react'
import { signOutServer } from '@/lib/core/auth/actions'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { ClientOnly } from '@/components/ui/client-only'
import { NotificationDropdown } from '@/components/features/notifications/NotificationDropdown'
import { useAuth } from '@/hooks/use-auth'
import { getAvatarUrl } from '@/lib/core/profile/utils'
import { FEATURES } from '@/lib/shared/config/features'

interface AdminLayoutProps {
  children: React.ReactNode
}

interface AdminNavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const adminNavItems: AdminNavItem[] = [
  {
    title: 'Dashboard',
    href: '/admin/dashboard',
    icon: IconLayoutDashboard,
  },
  {
    title: 'Utilisateurs',
    href: '/admin/users',
    icon: IconUsers,
  },
  {
    title: 'KYC',
    href: '/admin/kyc',
    icon: IconFileCheck,
  },
  {
    title: 'Annonces',
    href: '/admin/announcements',
    icon: IconSpeakerphone,
  },
  {
    title: 'Réservations',
    href: '/admin/bookings',
    icon: IconPackage,
  },
  {
    title: 'Litiges',
    href: '/admin/disputes',
    icon: IconAlertTriangle,
  },
  {
    title: 'Transactions',
    href: '/admin/transactions',
    icon: IconCreditCard,
  },
  {
    title: 'Feedback',
    href: '/admin/feedback',
    icon: IconMessageCircle,
  },
]

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const navItems = FEATURES.BETA_MODE
    ? adminNavItems
    : adminNavItems.filter(item => item.href !== '/admin/feedback')

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4 md:hidden">
        <ClientOnly>
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Ouvrir le menu admin"
              >
                <IconMenu2 className="h-5 w-5" />
                <span className="sr-only">Ouvrir le menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">Menu d'administration</SheetTitle>
              <SidebarContent
                navItems={navItems}
                pathname={pathname}
                onNavigate={() => setSidebarOpen(false)}
              />
            </SheetContent>
          </Sheet>
        </ClientOnly>
        <div className="flex-1">
          <LogoLink className="h-6" />
        </div>
        <HeaderActions />
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:left-0 md:border-r">
          <SidebarContent navItems={navItems} pathname={pathname} />
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:ml-64">
          {/* Desktop Header */}
          <header className="sticky top-0 z-40 hidden h-16 items-center gap-4 border-b bg-background px-6 md:flex">
            <div className="flex flex-1 items-center gap-4" />
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
  navItems,
}: {
  pathname: string
  onNavigate?: () => void
  navItems: AdminNavItem[]
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <LogoLink className="h-6" onClick={onNavigate} />
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 space-y-1 p-4"
        aria-label="Navigation administration"
      >
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
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

function HeaderActions() {
  return (
    <div className="flex items-center gap-2">
      {/* Badge ADMIN à la place de la recherche */}
      <Badge
        variant="destructive"
        className="h-8 text-[10px] font-semibold px-3"
      >
        ADMIN
      </Badge>

      <ClientOnly>
        <ThemeToggle />
      </ClientOnly>

      <ClientOnly>
        <NotificationDropdown />
      </ClientOnly>

      <ClientOnly>
        <AdminUserMenu />
      </ClientOnly>
    </div>
  )
}

function LogoLink({
  className,
  onClick,
}: {
  className?: string
  onClick?: () => void
}) {
  return (
    <Link
      href="/"
      className={cn('flex items-center gap-2', className)}
      onClick={onClick}
    >
      <Image
        src="/images/branding/logo.svg"
        alt="Sendbox"
        width={130}
        height={26}
        className="h-6 w-auto dark:hidden"
      />
      <Image
        src="/images/branding/logo-white.svg"
        alt="Sendbox"
        width={130}
        height={26}
        className="hidden h-6 w-auto dark:block"
      />
    </Link>
  )
}

function AdminUserMenu() {
  const router = useRouter()
  const { user, profile, loading, signOut: authSignOut } = useAuth()
  const [avatarError, setAvatarError] = useState(false)

  // Timeout après 10s si toujours en chargement
  useEffect(() => {
    if (!loading) {
      setAvatarError(false)
      return
    }

    const timer = setTimeout(() => {
      console.warn('Avatar loading timeout after 10s')
      setAvatarError(true)
    }, 10000)

    return () => clearTimeout(timer)
  }, [loading])

  const handleLogout = async () => {
    try {
      // 1. Nettoyer côté client d'abord (cache, état local)
      await authSignOut()

      // 2. Appeler l'action serveur pour nettoyer les cookies serveur
      await signOutServer()

      // 3. Rediriger vers la page de login
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Erreur lors de la déconnexion')

      // En cas d'erreur, rediriger quand même vers la page de login
      router.push('/login')
      router.refresh()
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
    ? `${(profile as any).firstname || ''} ${(profile as any).lastname || ''}`.trim() ||
      'Admin'
    : 'Admin'

  const initials = profile
    ? `${(profile as any).firstname?.[0] || ''}${(profile as any).lastname?.[0] || ''}`.toUpperCase() ||
      'A'
    : 'A'

  const avatarUrl = getAvatarUrl(
    (profile as any)?.avatar_url || null,
    (profile as any)?.id || user?.id || displayName
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-9 w-9 rounded-full focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Menu administrateur"
        >
          <Avatar className="h-9 w-9">
            {!avatarError && (
              <AvatarImage
                src={avatarUrl}
                alt={displayName}
                onError={() => setAvatarError(true)}
              />
            )}
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {/* Badge admin sur avatar */}
          <span
            className="absolute -bottom-0.5 -right-0.5"
            aria-label="Administrateur"
          >
            <IconRosetteDiscountCheck
              className="h-4 w-4 text-red-500 fill-red-500"
              strokeWidth={1.5}
            />
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email || 'admin@sendbox.com'}
            </p>
            {/* Badge ADMIN */}
            <Badge variant="destructive" className="w-fit text-xs mt-2">
              <IconCheck className="mr-1 h-3 w-3" />
              Administrateur
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/admin/dashboard" className="cursor-pointer">
            <IconLayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard admin</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <IconLogout className="mr-2 h-4 w-4" />
          <span>Déconnexion</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
