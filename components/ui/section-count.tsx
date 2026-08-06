import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface SectionCountProps {
  count: number
  singular: string
  plural?: string
  className?: string
}

export function SectionCount({
  count,
  singular,
  plural,
  className,
}: SectionCountProps) {
  const label = count > 1 ? plural || `${singular}s` : singular

  return (
    <Badge
      variant="outline"
      className={cn(
        'shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium text-muted-foreground',
        className
      )}
    >
      {count} {label}
    </Badge>
  )
}
