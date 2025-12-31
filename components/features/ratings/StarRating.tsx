/**
 * Composant pour afficher et sélectionner un rating avec étoiles
 */

'use client'

import { useState } from 'react'
import { IconStar } from '@tabler/icons-react'
import { cn } from "@/lib/utils"

interface StarRatingProps {
  rating: number
  onRatingChange: (rating: number) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function StarRating({
  rating,
  onRatingChange,
  disabled = false,
  size = 'md',
}: StarRatingProps) {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null)

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  const handleClick = (value: number) => {
    if (!disabled) {
      onRatingChange(value)
    }
  }

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((value) => {
        const isFilled =
          hoveredRating !== null
            ? value <= hoveredRating
            : value <= rating

        return (
          <button
            key={value}
            type="button"
            onClick={() => handleClick(value)}
            onMouseEnter={() => !disabled && setHoveredRating(value)}
            onMouseLeave={() => setHoveredRating(null)}
            disabled={disabled}
            className={cn(
              'transition-colors',
              disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-110',
              sizeClasses[size]
            )}
          >
            <IconStar
              className={cn(
                sizeClasses[size],
                isFilled
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-gray-200 text-gray-200',
                !disabled && 'hover:fill-yellow-300 hover:text-yellow-300'
              )}
            />
          </button>
        )
      })}
    </div>
  )
}










