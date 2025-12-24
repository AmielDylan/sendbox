'use client'

import {
  IconCheck,
  IconInfoCircle,
  IconLoader2,
  IconX,
  IconAlertTriangle,
} from '@tabler/icons-react'
import { Toaster as Sonner } from 'sonner'

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      icons={{
        success: <IconCheck className="h-4 w-4" />,
        info: <IconInfoCircle className="h-4 w-4" />,
        warning: <IconAlertTriangle className="h-4 w-4" />,
        error: <IconX className="h-4 w-4" />,
        loading: <IconLoader2 className="h-4 w-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
