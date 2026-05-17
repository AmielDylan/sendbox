'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { IconCheck, IconLoader2 } from '@tabler/icons-react'
import { approveCustomKYCCountry } from '@/lib/core/admin/actions'

interface Props {
  userId: string
  label: string
}

export function ApproveCountryButton({ userId, label }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function handleApprove() {
    setStatus('loading')
    const result = await approveCustomKYCCountry(userId, label)
    setStatus(result.error ? 'error' : 'done')
  }

  if (status === 'done') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-green-600">
        <IconCheck className="h-3.5 w-3.5" />
        Pays enregistré dans la liste
      </div>
    )
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="text-xs h-7 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400"
      disabled={status === 'loading'}
      onClick={handleApprove}
    >
      {status === 'loading' ? (
        <IconLoader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
      ) : null}
      Ajouter &quot;{label}&quot; à la liste
    </Button>
  )
}
