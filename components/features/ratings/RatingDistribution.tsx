/**
 * Composant pour afficher la distribution des ratings
 */

'use client'

import { Star } from 'lucide-react'

interface RatingDistributionProps {
  distribution: Record<number, number>
  totalRatings: number
}

export function RatingDistribution({
  distribution,
  totalRatings,
}: RatingDistributionProps) {
  const maxCount = Math.max(...Object.values(distribution))

  return (
    <div className="space-y-2">
      {[5, 4, 3, 2, 1].map((stars) => {
        const count = distribution[stars] || 0
        const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0
        const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0

        return (
          <div key={stars} className="flex items-center gap-2">
            <div className="flex items-center gap-1 w-16">
              <span className="text-sm font-medium">{stars}</span>
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            </div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 transition-all duration-300"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
            <span className="text-sm text-muted-foreground w-12 text-right">
              {count}
            </span>
          </div>
        )
      })}
    </div>
  )
}





