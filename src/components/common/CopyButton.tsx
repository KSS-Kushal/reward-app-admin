import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface CopyButtonProps {
  value: string
  label?: string
  /** Show the label next to the icon. */
  showLabel?: boolean
  size?: 'sm' | 'icon'
}

export function CopyButton({ value, label = 'Copy', showLabel = false, size = 'icon' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success('Copied to clipboard.')
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Unable to copy. Your browser blocked clipboard access.')
    }
  }

  const icon = copied ? <Check /> : <Copy />
  if (showLabel) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={copy}>
        {icon}
        {label}
      </Button>
    )
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size={size}
          className="size-7"
          onClick={copy}
          aria-label={label}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
