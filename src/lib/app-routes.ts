/**
 * In-app routes of the Kavodnik mobile app that banners and notifications may open.
 * Mirrors the backend's list (AdminValidation); the backend remains the authority.
 */
export const APP_ROUTES = [
  { value: '/home', label: 'Home' },
  { value: '/rewards', label: 'Rewards' },
  { value: '/wallet', label: 'Wallet' },
  { value: '/profile', label: 'Profile' },
  { value: '/profile/edit', label: 'Edit profile' },
  { value: '/settings', label: 'Settings' },
  { value: '/leaderboard', label: 'Leaderboard' },
  { value: '/notifications', label: 'Notifications' },
  { value: '/invite', label: 'Invite friends' },
  { value: '/contact-us', label: 'Contact us' },
  { value: '/daily-checkin', label: 'Daily check-in' },
  { value: '/spin-wheel', label: 'Spin wheel' },
  { value: '/scratch-card', label: 'Scratch card' },
  { value: '/captcha', label: 'Captcha' },
  { value: '/read-and-earn', label: 'Read & Earn' },
  { value: '/shop-and-earn', label: 'Shop & Earn' },
  { value: '/articles', label: 'Articles' },
  { value: '/quiz/daily', label: 'Daily quiz' },
  { value: '/quiz/math', label: 'Math quiz' },
  { value: '/quiz/give-answer', label: 'Give answer quiz' },
] as const

const DYNAMIC_ROUTES = [/^\/shop-and-earn\/[A-Za-z0-9_-]+$/, /^\/articles\/[A-Za-z0-9_-]+$/]

export function isAppRoute(route: string): boolean {
  return (
    APP_ROUTES.some((item) => item.value === route) || DYNAMIC_ROUTES.some((pattern) => pattern.test(route))
  )
}
