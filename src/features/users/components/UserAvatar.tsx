import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { initials } from '@/lib/format'
import { cn } from '@/lib/utils'

export function UserAvatar({
  name,
  avatarUrl,
  className,
}: {
  name: string
  avatarUrl: string | null
  className?: string
}) {
  return (
    <Avatar className={cn('size-8', className)}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt="" referrerPolicy="no-referrer" loading="lazy" />}
      <AvatarFallback className="text-xs">{initials(name)}</AvatarFallback>
    </Avatar>
  )
}
