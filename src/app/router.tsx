import { createBrowserRouter, Navigate, type RouteObject } from 'react-router'
import { AdminLayout } from '@/components/layout/AdminLayout'
import type { RouteHandle } from '@/components/layout/breadcrumb-context'
import { AdminRoute, ProtectedRoute } from '@/features/auth/components/guards'
import { NotFoundPage } from './routes/NotFoundPage'
import { RouteErrorPage } from './routes/RouteErrorPage'

const handle = (crumb: string, section?: string): RouteHandle => ({ crumb, section })

/** Every admin page is code-split: only the shell loads up front. */
const adminRoutes: RouteObject[] = [
  {
    index: true,
    handle: handle('Dashboard', 'Overview'),
    lazy: () =>
      import('@/features/dashboard/pages/DashboardPage').then((m) => ({ Component: m.DashboardPage })),
  },
  {
    path: 'users',
    handle: handle('Users', 'Management'),
    children: [
      {
        index: true,
        lazy: () => import('@/features/users/pages/UsersPage').then((m) => ({ Component: m.UsersPage })),
      },
      {
        path: ':id',
        handle: handle('User details'),
        lazy: () =>
          import('@/features/users/pages/UserDetailsPage').then((m) => ({ Component: m.UserDetailsPage })),
      },
    ],
  },
  {
    path: 'media',
    handle: handle('Media', 'Content'),
    lazy: () => import('@/features/media/pages/MediaPage').then((m) => ({ Component: m.MediaPage })),
  },
  {
    path: 'banners',
    handle: handle('Banners', 'Content'),
    children: [
      {
        index: true,
        lazy: () =>
          import('@/features/banners/pages/BannersPage').then((m) => ({ Component: m.BannersPage })),
      },
      {
        path: 'new',
        handle: handle('New banner'),
        lazy: () =>
          import('@/features/banners/pages/BannerEditorPage').then((m) => ({
            Component: m.BannerEditorPage,
          })),
      },
      {
        path: ':id/edit',
        handle: handle('Edit banner'),
        lazy: () =>
          import('@/features/banners/pages/BannerEditorPage').then((m) => ({
            Component: m.BannerEditorPage,
          })),
      },
    ],
  },
  {
    path: 'earn-options',
    handle: handle('Earn Options', 'Content'),
    lazy: () =>
      import('@/features/earn-options/pages/EarnOptionsPage').then((m) => ({ Component: m.EarnOptionsPage })),
  },
  {
    path: 'article-categories',
    handle: handle('Article Categories', 'Content'),
    lazy: () =>
      import('@/features/article-categories/pages/ArticleCategoriesPage').then((m) => ({
        Component: m.ArticleCategoriesPage,
      })),
  },
  {
    path: 'articles',
    handle: handle('Articles', 'Content'),
    children: [
      {
        index: true,
        lazy: () =>
          import('@/features/articles/pages/ArticlesPage').then((m) => ({ Component: m.ArticlesPage })),
      },
      {
        path: 'new',
        handle: handle('New article'),
        lazy: () =>
          import('@/features/articles/pages/ArticleEditorPage').then((m) => ({
            Component: m.ArticleEditorPage,
          })),
      },
      {
        path: ':id/edit',
        handle: handle('Edit article'),
        lazy: () =>
          import('@/features/articles/pages/ArticleEditorPage').then((m) => ({
            Component: m.ArticleEditorPage,
          })),
      },
    ],
  },
  {
    path: 'faqs',
    handle: handle('FAQs', 'Content'),
    lazy: () => import('@/features/faqs/pages/FaqsPage').then((m) => ({ Component: m.FaqsPage })),
  },
  {
    path: 'quiz-questions',
    handle: handle('Quiz Questions', 'Rewards'),
    children: [
      {
        index: true,
        lazy: () =>
          import('@/features/quizzes/pages/QuizQuestionsPage').then((m) => ({
            Component: m.QuizQuestionsPage,
          })),
      },
      {
        path: 'new',
        handle: handle('New question'),
        lazy: () =>
          import('@/features/quizzes/pages/QuizQuestionEditorPage').then((m) => ({
            Component: m.QuizQuestionEditorPage,
          })),
      },
      {
        path: ':id/edit',
        handle: handle('Edit question'),
        lazy: () =>
          import('@/features/quizzes/pages/QuizQuestionEditorPage').then((m) => ({
            Component: m.QuizQuestionEditorPage,
          })),
      },
    ],
  },
  {
    path: 'merchant-categories',
    handle: handle('Merchant Categories', 'Shop'),
    lazy: () =>
      import('@/features/merchant-categories/pages/MerchantCategoriesPage').then((m) => ({
        Component: m.MerchantCategoriesPage,
      })),
  },
  {
    path: 'merchants',
    handle: handle('Merchants', 'Shop'),
    children: [
      {
        index: true,
        lazy: () =>
          import('@/features/merchants/pages/MerchantsPage').then((m) => ({ Component: m.MerchantsPage })),
      },
      {
        path: 'new',
        handle: handle('New merchant'),
        lazy: () =>
          import('@/features/merchants/pages/MerchantEditorPage').then((m) => ({
            Component: m.MerchantEditorPage,
          })),
      },
      {
        path: ':id',
        handle: handle('Merchant'),
        children: [
          {
            index: true,
            lazy: () =>
              import('@/features/merchants/pages/MerchantDetailPage').then((m) => ({
                Component: m.MerchantDetailPage,
              })),
          },
          {
            path: 'offers',
            handle: handle('Offers'),
            lazy: () =>
              import('@/features/merchants/pages/MerchantDetailPage').then((m) => ({
                Component: m.MerchantDetailPage,
              })),
          },
          {
            path: 'products',
            handle: handle('Products'),
            children: [
              {
                index: true,
                lazy: () =>
                  import('@/features/merchants/pages/MerchantDetailPage').then((m) => ({
                    Component: m.MerchantDetailPage,
                  })),
              },
              {
                path: 'new',
                handle: handle('New product'),
                lazy: () =>
                  import('@/features/products/pages/ProductEditorPage').then((m) => ({
                    Component: m.ProductEditorPage,
                  })),
              },
              {
                path: 'bulk',
                handle: handle('Bulk import'),
                lazy: () =>
                  import('@/features/products/pages/BulkProductsPage').then((m) => ({
                    Component: m.BulkProductsPage,
                  })),
              },
            ],
          },
          {
            path: 'edit',
            handle: handle('Edit'),
            lazy: () =>
              import('@/features/merchants/pages/MerchantEditorPage').then((m) => ({
                Component: m.MerchantEditorPage,
              })),
          },
        ],
      },
    ],
  },
  {
    path: 'offers',
    handle: handle('Offers', 'Shop'),
    lazy: () => import('@/features/offers/pages/OffersPage').then((m) => ({ Component: m.OffersPage })),
  },
  {
    path: 'products',
    handle: handle('Products', 'Shop'),
    children: [
      {
        index: true,
        lazy: () =>
          import('@/features/products/pages/ProductsPage').then((m) => ({ Component: m.ProductsPage })),
      },
      {
        path: ':id/edit',
        handle: handle('Edit product'),
        lazy: () =>
          import('@/features/products/pages/ProductEditorPage').then((m) => ({
            Component: m.ProductEditorPage,
          })),
      },
    ],
  },
  {
    path: 'cashback',
    handle: handle('Cashback', 'Shop'),
    lazy: () => import('@/features/cashback/pages/CashbackPage').then((m) => ({ Component: m.CashbackPage })),
  },
  {
    path: 'payouts',
    handle: handle('Payouts', 'Wallet'),
    lazy: () => import('@/features/payouts/pages/PayoutsPage').then((m) => ({ Component: m.PayoutsPage })),
  },
  {
    path: 'redeem-options',
    handle: handle('Redeem Options', 'Wallet'),
    lazy: () =>
      import('@/features/redeem-options/pages/RedeemOptionsPage').then((m) => ({
        Component: m.RedeemOptionsPage,
      })),
  },
  {
    path: 'config',
    handle: handle('Configuration', 'System'),
    lazy: () =>
      import('@/features/configuration/pages/ConfigurationPage').then((m) => ({
        Component: m.ConfigurationPage,
      })),
  },
  {
    path: 'ads',
    handle: handle('Ads', 'Ads'),
    children: [
      {
        index: true,
        handle: handle('Overview'),
        lazy: () =>
          import('@/features/ads/pages/AdsOverviewPage').then((m) => ({ Component: m.AdsOverviewPage })),
      },
      {
        path: 'settings',
        handle: handle('Settings'),
        lazy: () =>
          import('@/features/ads/pages/AdSettingsPage').then((m) => ({ Component: m.AdSettingsPage })),
      },
      {
        path: 'history',
        handle: handle('History'),
        lazy: () =>
          import('@/features/ads/pages/AdHistoryPage').then((m) => ({ Component: m.AdHistoryPage })),
      },
      {
        path: 'reward-claims',
        handle: handle('Reward Claims'),
        lazy: () =>
          import('@/features/reward-claims/pages/RewardClaimsPage').then((m) => ({
            Component: m.RewardClaimsPage,
          })),
      },
      {
        path: 'callbacks',
        handle: handle('Callback Log'),
        lazy: () =>
          import('@/features/ads/pages/CallbackLogPage').then((m) => ({ Component: m.CallbackLogPage })),
      },
    ],
  },
  {
    path: 'audit-log',
    handle: handle('Audit Logs', 'System'),
    lazy: () =>
      import('@/features/audit-log/pages/AuditLogPage').then((m) => ({ Component: m.AuditLogPage })),
  },
  { path: '*', element: <NotFoundPage /> },
]

export const router = createBrowserRouter([
  {
    path: '/',
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <Navigate to="/admin" replace /> },
      {
        path: 'login',
        lazy: () => import('@/features/auth/pages/LoginPage').then((m) => ({ Component: m.LoginPage })),
      },
      {
        path: 'unauthorized',
        lazy: () =>
          import('@/features/auth/pages/UnauthorizedPage').then((m) => ({ Component: m.UnauthorizedPage })),
      },
      {
        path: 'admin',
        element: (
          <ProtectedRoute>
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          </ProtectedRoute>
        ),
        errorElement: <RouteErrorPage />,
        children: adminRoutes,
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
