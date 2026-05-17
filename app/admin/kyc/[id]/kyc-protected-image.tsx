'use client'

import Image from 'next/image'

interface Props {
  src: string
  alt: string
}

export function KYCProtectedImage({ src, alt }: Props) {
  return (
    <div
      className="relative aspect-video overflow-hidden rounded-lg border bg-muted select-none"
      onContextMenu={e => e.preventDefault()}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-contain"
        unoptimized
        draggable={false}
      />
    </div>
  )
}
