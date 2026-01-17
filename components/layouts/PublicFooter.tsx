/**
 * Footer public pour toutes les pages publiques
 */

import Link from 'next/link'
import Image from 'next/image'
import { IconPackage, IconBrandFacebook, IconBrandInstagram, IconBrandLinkedin, IconShieldCheck, IconStar } from '@tabler/icons-react'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

export function PublicFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-background">
      <div className="container-wide py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* À propos */}
          <div className="space-y-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <Image
                src="/images/branding/logo.svg"
                alt="Sendbox"
                width={145}
                height={29}
                className="h-8 w-auto transition-opacity group-hover:opacity-80"
              />
            </Link>

            {/* Tagline */}
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              La plateforme de confiance pour le covalisage international entre l'Europe et l'Afrique.
              Rapide, sécurisé et économique.
            </p>
            <p className="text-xs text-muted-foreground/80 max-w-xs">
              Actuellement disponible entre la France et le Bénin
            </p>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Badge variant="outline" className="text-xs gap-1.5">
                <IconShieldCheck className="h-3.5 w-3.5" />
                100% Sécurisé
              </Badge>
              <Badge variant="outline" className="text-xs gap-1.5">
                <IconStar className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                4.8/5 Avis
              </Badge>
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider">
              Navigation
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Accueil
                </Link>
              </li>
              <li>
                <Link
                  href="/recherche"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Rechercher
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Connexion
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Inscription
                </Link>
              </li>
            </ul>
          </div>

          {/* Légal */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider">
              Légal
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/cgu"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Conditions générales
                </Link>
              </li>
              <li>
                <Link
                  href="/politique-confidentialite"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <Link
                  href="/mentions-legales"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Mentions légales
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom bar */}
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            © {currentYear} Sendbox. Tous droits réservés.
          </p>

          {/* Social links - icônes sans liens pour V1 */}
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-full hover:bg-muted transition-colors cursor-not-allowed opacity-50">
              <IconBrandFacebook className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="p-2 rounded-full hover:bg-muted transition-colors cursor-not-allowed opacity-50">
              <IconBrandInstagram className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="p-2 rounded-full hover:bg-muted transition-colors cursor-not-allowed opacity-50">
              <IconBrandLinkedin className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
