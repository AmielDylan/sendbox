/**
 * Layout pour les pages admin
 */

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/actions/admin'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Users,
  FileCheck,
  Megaphone,
  Package,
  AlertTriangle,
  CreditCard,
  Loader2,
} from 'lucide-react'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await isAdmin()

  if (!admin) {
    redirect('/')
  }

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Utilisateurs', icon: Users },
    { href: '/admin/kyc', label: 'KYC', icon: FileCheck },
    { href: '/admin/announcements', label: 'Annonces', icon: Megaphone },
    { href: '/admin/bookings', label: 'Réservations', icon: Package },
    { href: '/admin/disputes', label: 'Litiges', icon: AlertTriangle },
    { href: '/admin/transactions', label: 'Transactions', icon: CreditCard },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 border-r bg-card">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary">Admin Sendbox</h1>
        </div>
        <nav className="space-y-1 px-4">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  asChild
                >
                  <span>
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </span>
                </Button>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="ml-64 p-8">
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }
        >
          {children}
        </Suspense>
      </main>
    </div>
  )
}

