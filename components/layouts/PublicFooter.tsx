/**
 * Footer public modernisé - Accordé avec la landing page Transit Magazine
 */

import Link from 'next/link'
import Image from 'next/image'
import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconShieldCheck,
  IconMail,
  IconMapPin,
} from '@tabler/icons-react'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

export function PublicFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-gradient-to-b from-background to-muted/20 relative">
      {/* Top gradient accent */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="container mx-auto px-6 sm:px-8 lg:px-12 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          {/* Brand section */}
          <div className="space-y-6 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 group w-fit">
              <Image
                src="/images/branding/logo.svg"
                alt="Sendbox"
                width={160}
                height={32}
                className="h-9 w-auto transition-all duration-300 group-hover:scale-105 dark:hidden"
              />
              <Image
                src="/images/branding/logo-white.svg"
                alt="Sendbox"
                width={160}
                height={32}
                className="hidden h-9 w-auto transition-all duration-300 group-hover:scale-105 dark:block"
              />
            </Link>

            <p className="text-base text-muted-foreground max-w-md leading-relaxed">
              La plateforme de covalisage qui transforme chaque voyage en
              solution d'envoi sécurisée. Économique, rapide et fiable.
            </p>

            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <IconMapPin className="h-5 w-5 mt-0.5 flex-shrink-0 text-primary" />
              <span>Actuellement disponible entre la France et le Bénin</span>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Badge variant="outline" className="text-xs gap-1.5 px-3 py-1.5">
                <IconShieldCheck className="h-4 w-4" />
                100% Sécurisé
              </Badge>
              <Badge variant="outline" className="text-xs gap-1.5 px-3 py-1.5">
                KYC Vérifié
              </Badge>
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-foreground">
              Navigation
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-muted-foreground hover:text-primary transition-colors duration-200 inline-flex items-center gap-2 group"
                >
                  <span className="w-0 group-hover:w-1.5 h-1.5 rounded-full bg-primary transition-all duration-200" />
                  Accueil
                </Link>
              </li>
              <li>
                <Link
                  href="/recherche"
                  className="text-muted-foreground hover:text-primary transition-colors duration-200 inline-flex items-center gap-2 group"
                >
                  <span className="w-0 group-hover:w-1.5 h-1.5 rounded-full bg-primary transition-all duration-200" />
                  Rechercher
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-muted-foreground hover:text-primary transition-colors duration-200 inline-flex items-center gap-2 group"
                >
                  <span className="w-0 group-hover:w-1.5 h-1.5 rounded-full bg-primary transition-all duration-200" />
                  Connexion
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="text-muted-foreground hover:text-primary transition-colors duration-200 inline-flex items-center gap-2 group"
                >
                  <span className="w-0 group-hover:w-1.5 h-1.5 rounded-full bg-primary transition-all duration-200" />
                  Inscription
                </Link>
              </li>
            </ul>
          </div>

          {/* Légal */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-foreground">
              Légal
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/terms"
                  className="text-muted-foreground hover:text-primary transition-colors duration-200 inline-flex items-center gap-2 group"
                >
                  <span className="w-0 group-hover:w-1.5 h-1.5 rounded-full bg-primary transition-all duration-200" />
                  Conditions générales
                </Link>
              </li>
              <li>
                <Link
                  href="/politique-confidentialite"
                  className="text-muted-foreground hover:text-primary transition-colors duration-200 inline-flex items-center gap-2 group"
                >
                  <span className="w-0 group-hover:w-1.5 h-1.5 rounded-full bg-primary transition-all duration-200" />
                  Confidentialité
                </Link>
              </li>
              <li>
                <Link
                  href="/mentions-legales"
                  className="text-muted-foreground hover:text-primary transition-colors duration-200 inline-flex items-center gap-2 group"
                >
                  <span className="w-0 group-hover:w-1.5 h-1.5 rounded-full bg-primary transition-all duration-200" />
                  Mentions légales
                </Link>
              </li>
            </ul>

            {/* Contact */}
            <div className="pt-4">
              <h4 className="font-medium text-sm mb-3 text-foreground">
                Contact
              </h4>
              <a
                href="mailto:contact@gosendbox.com"
                className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 inline-flex items-center gap-2"
              >
                <IconMail className="h-4 w-4" />
                contact@gosendbox.com
              </a>
            </div>
          </div>
        </div>

        <Separator className="my-12" />

        {/* Bottom bar */}
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            © {currentYear} Sendbox. Tous droits réservés. Fait avec ❤️ pour
            connecter l'Europe et l'Afrique.
          </p>

          {/* Social links */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">
              Suivez-nous
            </span>
            <a
              href="#"
              className="p-2 rounded-full hover:bg-primary/10 transition-all duration-200 cursor-not-allowed opacity-50 group"
              aria-label="Facebook"
            >
              <IconBrandFacebook className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </a>
            <a
              href="#"
              className="p-2 rounded-full hover:bg-primary/10 transition-all duration-200 cursor-not-allowed opacity-50 group"
              aria-label="Instagram"
            >
              <IconBrandInstagram className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </a>
            <a
              href="#"
              className="p-2 rounded-full hover:bg-primary/10 transition-all duration-200 cursor-not-allowed opacity-50 group"
              aria-label="LinkedIn"
            >
              <IconBrandLinkedin className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
