import {
  BadgePercent,
  BarChart3,
  Gift,
  History,
  MonitorPlay,
  Webhook,
  FileText,
  FolderTree,
  Gauge,
  HandCoins,
  HelpCircle,
  Images,
  LayoutDashboard,
  Megaphone,
  Package,
  ScrollText,
  Settings2,
  ShoppingBag,
  Sparkles,
  Store,
  Tags,
  Users,
  Wallet,
  Brain,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  title: string
  to: string
  icon: LucideIcon
  /** Custom active check (path + query). Defaults to a path-prefix match. */
  isActive?: (pathname: string, search: URLSearchParams) => boolean
}

export interface NavSection {
  title: string
  items: NavItem[]
}

const onConfig = (pathname: string) => pathname === '/admin/config'

export const navigation: NavSection[] = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        to: '/admin',
        icon: LayoutDashboard,
        isActive: (pathname) => pathname === '/admin',
      },
    ],
  },
  {
    title: 'Management',
    items: [{ title: 'Users', to: '/admin/users', icon: Users }],
  },
  {
    title: 'Content',
    items: [
      { title: 'Banners', to: '/admin/banners', icon: Megaphone },
      { title: 'Earn Options', to: '/admin/earn-options', icon: Sparkles },
      { title: 'Articles', to: '/admin/articles', icon: FileText },
      { title: 'Article Categories', to: '/admin/article-categories', icon: FolderTree },
      { title: 'Media', to: '/admin/media', icon: Images },
      { title: 'FAQs', to: '/admin/faqs', icon: HelpCircle },
    ],
  },
  {
    title: 'Rewards',
    items: [
      { title: 'Quiz Questions', to: '/admin/quiz-questions', icon: Brain },
      {
        title: 'Reward Configuration',
        to: '/admin/config?tab=rewards',
        icon: Gauge,
        isActive: (pathname, search) => onConfig(pathname) && search.get('tab') === 'rewards',
      },
    ],
  },
  {
    title: 'Shop',
    items: [
      { title: 'Merchants', to: '/admin/merchants', icon: Store },
      { title: 'Merchant Categories', to: '/admin/merchant-categories', icon: Tags },
      { title: 'Offers', to: '/admin/offers', icon: BadgePercent },
      { title: 'Products', to: '/admin/products', icon: Package },
      { title: 'Cashback', to: '/admin/cashback', icon: ShoppingBag },
    ],
  },
  {
    title: 'Wallet',
    items: [
      { title: 'Payouts', to: '/admin/payouts', icon: HandCoins },
      { title: 'Redeem Options', to: '/admin/redeem-options', icon: Wallet },
    ],
  },
  {
    title: 'Ads',
    items: [
      {
        title: 'Ads Overview',
        to: '/admin/ads',
        icon: BarChart3,
        isActive: (pathname) => pathname === '/admin/ads',
      },
      { title: 'Ad Settings', to: '/admin/ads/settings', icon: MonitorPlay },
      { title: 'Settings History', to: '/admin/ads/history', icon: History },
      { title: 'Reward Claims', to: '/admin/ads/reward-claims', icon: Gift },
      { title: 'Callback Log', to: '/admin/ads/callbacks', icon: Webhook },
    ],
  },
  {
    title: 'System',
    items: [
      {
        title: 'Business Configuration',
        to: '/admin/config',
        icon: Settings2,
        isActive: (pathname, search) => onConfig(pathname) && search.get('tab') !== 'rewards',
      },
      { title: 'Audit Logs', to: '/admin/audit-log', icon: ScrollText },
    ],
  },
]

export function isNavItemActive(item: NavItem, pathname: string, search: URLSearchParams): boolean {
  if (item.isActive) return item.isActive(pathname, search)
  return pathname === item.to || pathname.startsWith(`${item.to}/`)
}
