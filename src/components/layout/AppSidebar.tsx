import { ChevronsUpDown, LogOut, UserRound } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { useAuth } from '@/features/auth/context/auth-context'
import { initials } from '@/lib/format'
import { isNavItemActive, navigation } from './navigation'

function Brand() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" asChild>
          <Link to="/admin">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              K
            </div>
            <div className="grid flex-1 text-left leading-tight">
              <span className="truncate font-semibold">Kavodnik</span>
              <span className="truncate text-xs text-muted-foreground">Admin console</span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function UserMenu() {
  const { admin, signOut } = useAuth()
  const { isMobile } = useSidebar()
  const navigate = useNavigate()
  if (!admin) return null

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
              <Avatar className="size-8 rounded-lg">
                {admin.avatarUrl && <AvatarImage src={admin.avatarUrl} alt="" referrerPolicy="no-referrer" />}
                <AvatarFallback className="rounded-lg">{initials(admin.name)}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{admin.name}</span>
                <span className="truncate text-xs text-muted-foreground">{admin.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="font-normal">
              <p className="truncate text-sm font-medium">{admin.name}</p>
              <p className="truncate text-xs text-muted-foreground">{admin.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate(`/admin/users/${admin.id}`)}>
              <UserRound /> My account
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={async () => {
                await signOut()
                navigate('/login', { replace: true })
              }}
            >
              <LogOut /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export function AppSidebar() {
  const { pathname, search } = useLocation()
  const params = new URLSearchParams(search)
  const { isMobile, setOpenMobile } = useSidebar()

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <Brand />
      </SidebarHeader>
      <SidebarContent>
        <nav aria-label="Main">
          {navigation.map((section) => (
            <SidebarGroup key={section.title}>
              <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
              <SidebarMenu>
                {section.items.map((item) => {
                  const active = isNavItemActive(item, pathname, params)
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                        <Link
                          to={item.to}
                          aria-current={active ? 'page' : undefined}
                          onClick={() => isMobile && setOpenMobile(false)}
                        >
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroup>
          ))}
        </nav>
      </SidebarContent>
      <SidebarFooter>
        <UserMenu />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
