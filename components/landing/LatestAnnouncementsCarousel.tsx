'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/use-auth'
import { IconArrowRight, IconCalendar, IconMapPin } from '@tabler/icons-react'
import {
  format,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'

type AnnouncementPreview = {
  id: string
  traveler_id?: string | null
  departure_city: string | null
  departure_country: string | null
  arrival_city: string | null
  arrival_country: string | null
  departure_date: string | null
  arrival_date: string | null
  available_kg: number | null
  price_per_kg: number | null
  created_at: string | null
  status: string | null
  profiles?: {
    firstname: string | null
    lastname: string | null
    avatar_url: string | null
  } | null
}

const formatRelativeDate = (value?: string | null) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const now = new Date()
  const diffMinutes = Math.max(0, differenceInMinutes(now, date))
  const diffHours = Math.max(0, differenceInHours(now, date))
  const diffDays = Math.max(0, differenceInDays(now, date))

  if (diffDays > 5) {
    return { label: format(date, 'dd/MM/yyyy'), isNew: false }
  }
  if (diffDays >= 1) {
    return { label: `il y a ${diffDays} j`, isNew: true }
  }
  if (diffHours >= 1) {
    return { label: `il y a ${diffHours} h`, isNew: true }
  }
  if (diffMinutes >= 1) {
    return { label: `il y a ${diffMinutes} min`, isNew: true }
  }
  return { label: 'à l’instant', isNew: true }
}

export function LatestAnnouncementsCarousel() {
  const { user } = useAuth()
  const [items, setItems] = useState<AnnouncementPreview[]>([])
  const [loading, setLoading] = useState(true)
  const [paused, setPaused] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/announcements/latest?limit=12')
        const data = await res.json().catch(() => ({}))
        if (!isMounted) return
        setItems(Array.isArray(data?.data) ? data.data : [])
      } catch (error) {
        console.error('Latest announcements fetch failed:', error)
        if (isMounted) setItems([])
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    load()
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!containerRef.current || items.length < 2) return

    const el = containerRef.current
    const interval = window.setInterval(() => {
      if (paused) return
      const maxScroll = el.scrollWidth - el.clientWidth
      if (maxScroll <= 0) return
      const next = el.scrollLeft + 280
      if (next >= maxScroll - 8) {
        el.scrollTo({ left: 0, behavior: 'smooth' })
      } else {
        el.scrollTo({ left: next, behavior: 'smooth' })
      }
    }, 3200)

    return () => window.clearInterval(interval)
  }, [items.length, paused])

  const title = useMemo(() => {
    return items.length > 0
      ? 'Dernières annonces publiées'
      : 'Aucune annonce pour le moment'
  }, [items.length])

  return (
    <section className="py-16 sm:py-20 relative">
      <div className="container-wide space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <Badge
              variant="outline"
              className="text-xs uppercase tracking-widest font-semibold px-4 py-2"
            >
              Nouveautés
            </Badge>
            <h3 className="font-display text-3xl sm:text-4xl font-bold">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Explorez les trajets les plus récents et réservez en un clic.
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            {loading ? 'Chargement...' : `${items.length} annonces`}
          </div>
        </div>

        <div
          className="relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          <div
            ref={containerRef}
            className={cn(
              'flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2',
              '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
            )}
          >
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <Card
                  key={`skeleton-${i}`}
                  className="min-w-[240px] sm:min-w-[280px] border-2 border-border/60 bg-muted/30 p-4 animate-pulse"
                >
                  <div className="h-4 w-24 rounded bg-muted-foreground/20" />
                  <div className="mt-4 h-6 w-40 rounded bg-muted-foreground/20" />
                  <div className="mt-3 h-4 w-32 rounded bg-muted-foreground/20" />
                  <div className="mt-6 h-4 w-20 rounded bg-muted-foreground/20" />
                </Card>
              ))}

            {!loading &&
              items.map(item => {
                const href = user?.id ? `/annonces/${item.id}` : '/register'
                const origin =
                  item.departure_city || item.departure_country || '—'
                const destination =
                  item.arrival_city || item.arrival_country || '—'
                const price =
                  typeof item.price_per_kg === 'number'
                    ? `${item.price_per_kg}€ / kg`
                    : 'Tarif à définir'
                const maxKg =
                  typeof item.available_kg === 'number'
                    ? `${item.available_kg} kg dispo`
                    : null
                const travelerProfile = item.profiles
                const travelerName =
                  travelerProfile?.firstname ||
                  travelerProfile?.lastname ||
                  'Voyageur'
                const travelerInitials = travelerName
                  .split(' ')
                  .map(part => part[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()
                const relativeDate = formatRelativeDate(item.created_at)
                const isNew = relativeDate?.isNew ?? true

                return (
                  <Link
                    key={item.id}
                    href={href}
                    className="snap-start"
                  >
                    <Card className="group min-w-[240px] sm:min-w-[280px] border-2 border-border bg-background p-4 transition-all duration-300 hover:border-primary/60 hover:shadow-xl">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Avatar className="h-7 w-7 text-xs">
                          <AvatarImage
                            src={travelerProfile?.avatar_url || ''}
                            alt={travelerName}
                          />
                          <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                            {travelerInitials || 'S'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground truncate max-w-[120px]">
                          {travelerName}
                        </span>
                        {isNew && (
                          <Badge
                            variant="secondary"
                            className="bg-primary/10 text-primary shrink-0"
                          >
                            Nouveau
                          </Badge>
                        )}
                        <span className="ml-auto flex items-center gap-1 shrink-0">
                          <IconCalendar className="h-3.5 w-3.5" />
                          {relativeDate?.label || '—'}
                        </span>
                      </div>

                      <div className="mt-4 space-y-2">
                        <p className="text-base font-semibold text-foreground">
                          {origin} → {destination}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <IconMapPin className="h-3.5 w-3.5" />
                          {maxKg || 'Capacité en attente'}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">
                          {price}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-primary group-hover:translate-x-1 transition-transform">
                          Voir
                          <IconArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </Card>
                  </Link>
                )
              })}
          </div>
        </div>
      </div>
    </section>
  )
}
