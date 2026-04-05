import { HomePageContent } from '@/components/landing/HomePageContent'
import { PublicFooter } from '@/components/layouts/PublicFooter'
import { PublicHeader } from '@/components/layouts/PublicHeader'

export default function HomePage() {
  return (
    <>
      <PublicHeader />
      <HomePageContent />
      <PublicFooter />
    </>
  )
}
