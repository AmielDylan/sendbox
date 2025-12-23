/**
 * Galerie de photos du colis
 */

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X, ZoomIn } from 'lucide-react'

interface PackagePhotosGalleryProps {
  photos: string[]
  className?: string
}

export function PackagePhotosGallery({ photos, className }: PackagePhotosGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  if (!photos || photos.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-md border border-dashed">
        <p className="text-sm text-muted-foreground">Aucune photo du colis</p>
      </div>
    )
  }

  return (
    <>
      <div className={`grid grid-cols-2 gap-4 md:grid-cols-3 ${className}`}>
        {photos.map((photo, index) => (
          <button
            key={index}
            onClick={() => setSelectedPhoto(photo)}
            className="group relative aspect-square overflow-hidden rounded-lg border bg-muted transition-all hover:border-primary"
          >
            <Image
              src={photo}
              alt={`Photo du colis ${index + 1}`}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
              <ZoomIn className="h-6 w-6 text-white" />
            </div>
          </button>
        ))}
      </div>

      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 z-50"
            onClick={() => setSelectedPhoto(null)}
          >
            <X className="h-4 w-4" />
          </Button>
          {selectedPhoto && (
            <div className="relative h-[70vh] w-full">
              <Image
                src={selectedPhoto}
                alt="Photo du colis"
                fill
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}





