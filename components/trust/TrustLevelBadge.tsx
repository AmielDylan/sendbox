import { IconShieldCheck, IconStar } from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  formatTrustScore,
  getTrustLevel,
  type TrustLevelInput,
} from '@/lib/trust/levels'

type TrustLevelBadgeProps = TrustLevelInput & {
  compact?: boolean
  showScore?: boolean
  className?: string
}

const levelClassName = {
  new: 'border-border bg-muted/50 text-muted-foreground',
  reliable:
    'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  very_reliable:
    'border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  ambassador:
    'border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-300',
}

export function TrustLevelBadge({
  trustScore,
  completedCount,
  disputedCount,
  compact = false,
  showScore = true,
  className,
}: TrustLevelBadgeProps) {
  const level = getTrustLevel({ trustScore, completedCount, disputedCount })
  const formattedScore = formatTrustScore(trustScore)

  return (
    <Badge
      variant="outline"
      title={level.description}
      className={cn(
        'gap-1.5 whitespace-nowrap rounded-md px-2 py-1 font-medium',
        levelClassName[level.key],
        className
      )}
    >
      {level.key === 'new' ? (
        <IconShieldCheck className="h-3.5 w-3.5" stroke={1.8} />
      ) : (
        <IconStar className="h-3.5 w-3.5" stroke={1.8} />
      )}
      <span>{compact ? level.shortLabel : level.label}</span>
      {showScore && formattedScore && (
        <span className="text-[10px] opacity-75">{formattedScore}/5</span>
      )}
    </Badge>
  )
}
