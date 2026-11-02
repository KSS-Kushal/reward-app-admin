import { MoreHorizontal, type LucideIcon } from 'lucide-react'
import { Fragment } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface RowAction {
  label: string
  icon?: LucideIcon
  onSelect: () => void
  destructive?: boolean
  disabled?: boolean
  /** Draw a separator above this item. */
  separated?: boolean
  hidden?: boolean
}

/** The "⋯" menu at the end of a table row. */
export function RowActions({ actions, label = 'Row actions' }: { actions: RowAction[]; label?: string }) {
  const visible = actions.filter((action) => !action.hidden)
  if (visible.length === 0) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8" aria-label={label}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {visible.map((action) => {
          const Icon = action.icon
          return (
            <Fragment key={action.label}>
              {action.separated && <DropdownMenuSeparator />}
              <DropdownMenuItem
                onSelect={action.onSelect}
                disabled={action.disabled}
                variant={action.destructive ? 'destructive' : 'default'}
              >
                {Icon && <Icon />}
                {action.label}
              </DropdownMenuItem>
            </Fragment>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
