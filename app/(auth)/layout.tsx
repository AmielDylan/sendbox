/**
 * Layout pour les routes d'authentification
 * Design avec sidebar sticky intelligente
 */

'use client'

import { usePathname } from 'next/navigation'
import { PublicFooter } from '@/components/layouts/PublicFooter'
import { PublicHeader } from '@/components/layouts/PublicHeader'
import { IconShieldCheck, IconClock, IconUsers, IconCheck } from '@tabler/icons-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isRegister = pathname?.includes('register')

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1 relative">
        {/* Atmospheric gradient background */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-emerald-500/5"
          aria-hidden="true"
        />

        {/* Subtle decorative elements */}
        <div
          className="absolute top-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-20 left-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"
          aria-hidden="true"
        />

        {/* Layout with sidebar and form */}
        <div className="container-wide relative z-10 py-12 sm:py-16 lg:py-20 px-4">
          <div className="grid lg:grid-cols-[380px_1fr] gap-8 items-start">
            {/* Smart Sticky Sidebar - Hidden on mobile/tablet */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-6">
                {isRegister ? (
                  <>
                    {/* Registration Progress */}
                    <div className="rounded-2xl border-2 border-border/50 bg-background/95 backdrop-blur-sm p-6 space-y-4">
                      <h3 className="text-lg font-semibold text-foreground">
                        Créez votre compte en 2 min
                      </h3>
                      <div className="space-y-3">
                        {[
                          'Informations personnelles',
                          'Email et mot de passe',
                          'Accepter les conditions',
                        ].map((step, i) => (
                          <div key={step} className="flex items-start gap-3">
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs font-semibold text-primary">
                                {i + 1}
                              </span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {step}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* What You Get */}
                    <div className="rounded-2xl border-2 border-border/50 bg-background/95 backdrop-blur-sm p-6 space-y-4">
                      <h3 className="text-lg font-semibold text-foreground">
                        Ce que vous obtenez
                      </h3>
                      <div className="space-y-3">
                        {[
                          { icon: IconShieldCheck, text: 'Profil vérifié et sécurisé' },
                          { icon: IconClock, text: 'Suivi en temps réel' },
                          { icon: IconUsers, text: 'Accès à la communauté' },
                        ].map((item) => (
                          <div key={item.text} className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <item.icon className="h-4 w-4 text-primary" />
                            </div>
                            <span className="text-sm text-foreground">
                              {item.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Login Benefits */}
                    <div className="rounded-2xl border-2 border-border/50 bg-background/95 backdrop-blur-sm p-6 space-y-4">
                      <h3 className="text-lg font-semibold text-foreground">
                        Votre espace Sendbox
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Accédez à votre tableau de bord pour gérer vos annonces,
                        suivre vos colis et communiquer en toute sécurité.
                      </p>
                    </div>

                    {/* Security Info */}
                    <div className="rounded-2xl border-2 border-border/50 bg-background/95 backdrop-blur-sm p-6 space-y-4">
                      <h3 className="text-lg font-semibold text-foreground">
                        Sécurité renforcée
                      </h3>
                      <div className="space-y-3">
                        {[
                          'Chiffrement de bout en bout',
                          'Authentification sécurisée',
                          'Vérification KYC disponible',
                        ].map((item) => (
                          <div key={item} className="flex items-start gap-2">
                            <IconCheck className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-muted-foreground">
                              {item}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Trust Indicator */}
                <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 backdrop-blur-sm p-4">
                  <p className="text-sm text-foreground text-center">
                    <span className="font-semibold">100% sécurisé</span>
                    <br />
                    <span className="text-muted-foreground text-xs">
                      Vos données sont protégées
                    </span>
                  </p>
                </div>
              </div>
            </aside>

            {/* Form Container - Right side */}
            <div className="flex justify-center lg:justify-start animate-fade-in-up">
              <div className="w-full max-w-lg">
                {children}
              </div>
            </div>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
