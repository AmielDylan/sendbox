'use client'

import {
  IconCamera,
  IconFolder,
  IconPhoto,
  IconX,
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

export type UploadMode = 'camera' | 'gallery' | 'file'

interface KYCUploadDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (mode: UploadMode) => void
  title: string
  description?: string
}

const OPTIONS: { mode: UploadMode; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { mode: 'camera', label: 'Prendre une photo', Icon: IconCamera },
  { mode: 'gallery', label: 'Depuis la galerie', Icon: IconPhoto },
  { mode: 'file', label: 'Depuis les fichiers', Icon: IconFolder },
]

export function KYCUploadDrawer({
  open,
  onOpenChange,
  onSelect,
  title,
  description,
}: KYCUploadDrawerProps) {
  function handleSelect(mode: UploadMode) {
    onOpenChange(false)
    // Defer click to allow sheet close animation to start
    setTimeout(() => onSelect(mode), 50)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-8">
        <SheetHeader className="mb-4 text-left">
          <SheetTitle className="text-base">{title}</SheetTitle>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </SheetHeader>

        <div className="flex flex-col gap-2">
          {OPTIONS.map(({ mode, label, Icon }) => (
            <button
              key={mode}
              type="button"
              onClick={() => handleSelect(mode)}
              className="flex min-h-[56px] w-full items-center gap-4 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-muted hover:border-border active:scale-[0.98]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background border border-border/60">
                <Icon className="h-4 w-4 text-primary" />
              </span>
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            <IconX className="h-4 w-4 mr-2" />
            Annuler
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
