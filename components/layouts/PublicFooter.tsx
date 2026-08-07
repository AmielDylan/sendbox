import Link from 'next/link'
import Image from 'next/image'
import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconMail,
  IconMapPin,
} from '@tabler/icons-react'

export function PublicFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative bg-neutral-950 text-neutral-400 overflow-hidden">
      {/* Globe mark décoratif — marque Sendbox en filigrane */}
      <svg
        viewBox="66 0 29 29"
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-8 -right-8 h-[340px] w-[340px] opacity-[0.045] text-white sm:-bottom-12 sm:-right-12 sm:h-[480px] sm:w-[480px]"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M80.4999 0C88.5077 0 95 6.49188 95 14.5C95 22.5081 88.5077 29 80.4999 29C72.4918 29 66 22.5081 66 14.5C66 6.49188 72.4918 0 80.4999 0ZM79.9758 1.08503C78.3216 1.31783 76.7464 2.64703 75.5237 4.87012C75.1691 5.51495 74.8491 6.22736 74.5702 6.99657C76.2328 6.57877 78.0591 6.33246 79.9758 6.29436V1.08503ZM73.3447 7.34483C73.6915 6.25645 74.1157 5.25509 74.6053 4.36497C75.2114 3.26293 75.9308 2.31126 76.7412 1.58033C72.3341 2.86029 68.8603 6.33417 67.5803 10.7414C68.3112 9.93091 69.2628 9.21156 70.3649 8.60546C71.2551 8.11587 72.2563 7.6916 73.3447 7.34483ZM72.9965 8.5703C72.5787 10.2329 72.3324 12.0592 72.2943 13.9759H67.085C67.3177 12.3217 68.647 10.7465 70.8701 9.52389C71.5149 9.16922 72.2273 8.84921 72.9965 8.5703ZM73.3427 13.9759C73.386 11.8842 73.6871 9.92047 74.1853 8.1854C75.9204 7.68718 77.8841 7.38601 79.9758 7.34273V9.60683C79.1955 11.6045 77.604 13.1959 75.6063 13.9759H73.3427ZM72.2943 15.0241H67.085C67.3177 16.6783 68.647 18.2534 70.8701 19.4761C71.5149 19.8308 72.2273 20.1508 72.9965 20.4297C72.5787 18.7671 72.3324 16.9408 72.2943 15.0241ZM74.1853 20.8146C73.6871 19.0795 73.386 17.1158 73.3427 15.0241H75.6063C77.604 15.8041 79.1955 17.3955 79.9758 19.3932V21.6573C77.8841 21.614 75.9204 21.3128 74.1853 20.8146ZM73.3447 21.6552C72.2563 21.3084 71.2551 20.8841 70.3649 20.3945C69.2628 19.7884 68.3112 19.0691 67.5803 18.2586C68.8603 22.6658 72.3341 26.1397 76.7412 27.4196C75.9308 26.6887 75.2114 25.7371 74.6053 24.635C74.1157 23.7449 73.6915 22.7435 73.3447 21.6552ZM79.9758 27.915C78.3216 27.6822 76.7464 26.353 75.5237 24.1299C75.1691 23.4851 74.8491 22.7726 74.5702 22.0035C76.2328 22.4212 78.0591 22.6676 79.9758 22.7056V27.915ZM84.2585 27.4196C85.069 26.6887 85.7882 25.7371 86.3943 24.635C86.8837 23.7449 87.3085 22.7435 87.6551 21.6552C88.7433 21.3084 89.7445 20.8841 90.6348 20.3945C91.7368 19.7884 92.6887 19.0691 93.4195 18.2586C92.1392 22.6658 88.6657 26.1397 84.2585 27.4196ZM86.4298 22.0035C86.1507 22.7726 85.8303 23.4851 85.4757 24.1299C84.2533 26.353 82.6781 27.6822 81.0239 27.915V22.7056C82.9406 22.6676 84.7669 22.4212 86.4298 22.0035ZM88.0031 20.4297C88.7723 20.1508 89.485 19.8308 90.1295 19.4761C92.353 18.2535 93.682 16.6783 93.9147 15.0241H88.7056C88.6672 16.9408 88.4207 18.7671 88.0031 20.4297ZM87.6573 15.0241C87.6138 17.1158 87.3129 19.0795 86.8141 20.8146C85.0793 21.3128 83.1156 21.614 81.0239 21.6573V19.3948C81.804 17.3964 83.3959 15.8043 85.3941 15.0241H87.6573ZM88.7056 13.9759H93.9147C93.682 12.3217 92.353 10.7465 90.1295 9.52389C89.485 9.16922 88.7723 8.84921 88.0031 8.5703C88.4207 10.2329 88.6672 12.0592 88.7056 13.9759ZM86.8141 8.1854C87.3129 9.92047 87.6138 11.8842 87.6573 13.9759H85.3942C83.3959 13.1957 81.804 11.6036 81.0239 9.60516V7.34273C83.1156 7.38601 85.0793 7.68718 86.8141 8.1854ZM87.6551 7.34483C88.7433 7.6916 89.7445 8.11587 90.6348 8.60546C91.7368 9.21156 92.6887 9.93091 93.4195 10.7414C92.1392 6.33417 88.6657 2.86029 84.2585 1.58033C85.069 2.31126 85.7882 3.26293 86.3943 4.36497C86.8837 5.25509 87.3085 6.25645 87.6551 7.34483ZM81.0239 1.08503C82.6781 1.31783 84.2533 2.64703 85.4757 4.87012C85.8303 5.51496 86.1507 6.22736 86.4298 6.99657C84.7669 6.57877 82.9406 6.33246 81.0239 6.29436V1.08503Z"
        />
      </svg>

      <div className="container-wide relative py-16 sm:py-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-6 md:col-span-2">
            <Link href="/" className="group flex w-fit items-center gap-2">
              <Image
                src="/images/branding/logo-white.svg"
                alt="Sendbox"
                width={140}
                height={28}
                className="h-8 w-auto opacity-80 transition-opacity group-hover:opacity-100"
              />
            </Link>

            <p className="max-w-sm text-sm leading-relaxed text-neutral-500">
              La plateforme de covalisage qui transforme chaque voyage en
              solution d'envoi vérifiée. France et Bénin en premier.
            </p>

            <div className="flex items-center gap-2 text-xs text-neutral-600">
              <IconMapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>France - Bénin · D'autres corridors arrivent</span>
            </div>

            <a
              href="mailto:contact@gosendbox.com"
              className="inline-flex items-center gap-2 text-sm text-neutral-500 transition-colors hover:text-white"
            >
              <IconMail className="h-4 w-4" aria-hidden="true" />
              contact@gosendbox.com
            </a>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
              Navigation
            </h3>
            <ul className="space-y-3 text-sm">
              {[
                { label: 'Accueil', href: '/' },
                { label: 'Rechercher', href: '/recherche' },
                { label: 'Connexion', href: '/login' },
                { label: 'Inscription', href: '/register' },
                { label: 'Changelog', href: '/changelog' },
              ].map(item => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-2 text-neutral-500 transition-colors hover:text-white group"
                  >
                    <span className="h-px w-0 bg-white transition-all duration-200 group-hover:w-3" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
              Légal
            </h3>
            <ul className="space-y-3 text-sm">
              {[
                { label: 'Conditions générales', href: '/cgu' },
                {
                  label: 'Confidentialité',
                  href: '/politique-confidentialite',
                },
                { label: 'Mentions légales', href: '/mentions-legales' },
              ].map(item => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-2 text-neutral-500 transition-colors hover:text-white group"
                  >
                    <span className="h-px w-0 bg-white transition-all duration-200 group-hover:w-3" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col items-center gap-4 border-t border-white/[0.06] pt-8 sm:flex-row sm:justify-between">
          <p className="text-xs text-neutral-600 text-center sm:text-left">
            © {currentYear} Sendbox. Fait pour connecter l'Europe et l'Afrique.
          </p>

          <div className="flex items-center gap-1">
            {[
              { Icon: IconBrandFacebook, label: 'Facebook' },
              { Icon: IconBrandInstagram, label: 'Instagram' },
              { Icon: IconBrandLinkedin, label: 'LinkedIn' },
            ].map(({ Icon, label }) => (
              <a
                key={label}
                href="#"
                className="cursor-not-allowed p-2 opacity-30 transition-opacity hover:opacity-50"
                aria-label={label}
              >
                <Icon className="h-4 w-4 text-neutral-400" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
