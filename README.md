# Kavodnik Admin

The administration panel for the Kavodnik rewards platform. Admins use it to manage users, content (banners, earn options, articles, FAQs, media), quizzes, the shop (merchants, offers, products, cashback), payouts and redeem options, business configuration, and to review the audit log.

It is a client of the Kavodnik backend only. Every screen calls the endpoints documented in `../reward/API_REFERENCE.md` under `/api/v1/admin`. The panel has no mock data and no API of its own. The backend decides permissions, wallet balances, rewards, payouts and validation; the checks in the frontend only make the forms easier to use.

## Technology stack

| Concern        | Choice                                                          |
| -------------- | --------------------------------------------------------------- |
| Framework      | React 19, TypeScript (strict), Vite                             |
| UI             | Tailwind CSS v4, shadcn/ui (Radix), Lucide icons, Sonner toasts |
| Routing        | React Router (data router, lazy-loaded routes)                  |
| Server state   | TanStack Query                                                  |
| HTTP           | Axios (one shared instance)                                     |
| Forms          | React Hook Form + Zod                                           |
| Tables         | TanStack Table                                                  |
| Dates / charts | date-fns, Recharts                                              |
| Auth           | Google Identity Services (`@react-oauth/google`)                |
| Tests          | Vitest, React Testing Library, jsdom                            |

## Getting started

Requirements: Node 20+ and a running Kavodnik backend (see `../reward/README.md`).

```bash
npm install
cp .env.example .env.local   # then set VITE_GOOGLE_CLIENT_ID
npm run dev                  # http://localhost:5173
```

Sign in with a Google account that has the `ADMIN` role. The backend promotes the emails listed in its `ADMIN_EMAILS` setting to admin when they sign in, and an existing admin can grant the role from **Users**.

## Environment variables

| Variable                | Purpose                                                                                                                 |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL`     | API base URL including `/api/v1`. Either absolute (`https://api.kavodnik.com/api/v1`) or relative (`/api/v1`).          |
| `VITE_GOOGLE_CLIENT_ID` | The Google OAuth **web** client id. It must be one of the backend's `GOOGLE_CLIENT_ID` values. The value is public.     |
| `VITE_DEV_PROXY_TARGET` | Development only. The address the Vite dev server forwards `/api` and `/actuator` to (default `http://localhost:8080`). |

Files: `.env` holds shared defaults, `.env.development` and `.env.production` hold per-mode overrides, `.env.local` holds your machine's values (git-ignored), and `.env.example` documents everything.

**Don't put secrets in these files.** Every `VITE_*` value is compiled into the JavaScript the browser downloads.

### API configuration and CORS

The backend has no CORS configuration, so the browser has to see the API as the same origin as the admin panel:

- **Development:** `.env.development` sets `VITE_API_BASE_URL=/api/v1`, and Vite forwards `/api/*` and `/actuator/*` to `VITE_DEV_PROXY_TARGET` (see `vite.config.ts`).
- **Production:** serve the built panel and the API from one origin through a reverse proxy (for example, nginx routing `/api` and `/actuator` to the backend), and keep `VITE_API_BASE_URL=/api/v1`. If you serve the panel from another domain instead, set an absolute URL and enable CORS for that origin on the backend.

## Authentication

1. The login page shows Google's sign-in button and receives an ID token.
2. It sends the token to `POST /auth/google` and receives an access token and a refresh token.
3. It calls `GET /admin/me`. Only the `ADMIN` role passes. A `403` revokes the new session with `POST /auth/logout` and shows the **403** page.
4. `ProtectedRoute` and `AdminRoute` guard every `/admin/*` route.

Tokens:

- One Axios request interceptor attaches `Authorization: Bearer <accessToken>` to every request.
- On a `401`, the response interceptor calls `POST /auth/refresh` once and retries the original request. Concurrent 401s share one refresh within a tab, and the Web Locks API serializes refreshes across tabs. This matters because the backend revokes the whole session when someone replays a refresh token that has already been rotated.
- If the refresh fails, the panel clears the session and sends the user to `/login`, keeping the page they were on so they can return to it after signing in.
- A `403` from an admin endpoint makes the panel check `/admin/me` again. This tells a business-rule 403 (for example, trying to ban yourself) apart from a lost ADMIN role.
- Tokens are kept in one `localStorage` entry so every tab shares the session. They are never logged and never put in URLs.

## Architecture

```
React Router (lazy routes) → pages → TanStack Query hooks → feature API services → api helpers → Axios client → Kavodnik API
```

```
src/
├── app/                  App, providers, router, 404 and route-error pages
├── components/
│   ├── ui/               shadcn/ui primitives (generated)
│   ├── layout/           AdminLayout, AppSidebar, Breadcrumbs, ThemeToggle, navigation
│   ├── common/           DataTable, Pagination, SearchInput, FilterSelect, ConfirmDialog,
│   │                     StatusBadge, states, DateTimePicker, ColorPicker, EntitySelect, …
│   ├── form/             typed form fields, FormActions, UnsavedChangesGuard
│   └── crud/             EntityDialog, CategoryManager (shared by both category types)
├── features/<feature>/
│   ├── api/              <feature>.api.ts (HTTP), keys.ts, queries.ts, mutations.ts or hooks.ts
│   ├── components/       feature UI
│   ├── pages/            route components
│   ├── schemas/          Zod schemas + form ↔ request mapping
│   └── types/            types taken from the API contract
├── hooks/                useListParams (URL state), useApiMutation, useDebouncedValue
├── lib/
│   ├── api/              client.ts, interceptors.ts, errors.ts, types.ts
│   ├── auth/             token storage, auth events
│   └── env.ts, query-client.ts, format.ts, forms.ts, app-routes.ts
├── styles/index.css      design tokens (light + dark)
└── test/                 test setup and render helpers
```

Features: `ads`, `reward-claims`, `auth`, `dashboard`, `users`, `media`, `banners`, `earn-options`, `article-categories`, `articles`, `faqs`, `quizzes`, `merchant-categories`, `merchants`, `offers`, `products`, `cashback`, `payouts`, `redeem-options`, `configuration`, `audit-log`.

Conventions:

- Components never call Axios. The `api` helpers return the envelope's `data` and reject with a normalized `ApiError`, which carries `status`, `code` and `fieldErrors`.
- Mutations go through `useApiMutation`, which shows a toast with the backend's message and invalidates the affected queries. Forms also put server field errors on the matching inputs with `applyServerErrors`. Bulk import keys such as `products[3].price` map to the right row.
- List filters, the page number and the page size live in the URL. For example, `/admin/articles?status=PUBLISHED&categoryId=finance&page=2` survives a refresh and can be shared. Page numbers are 1-based, as in the API.
- Every edit form for a `PUT` endpoint sends the complete body, because the API requires every editable field.
- Configuration forms are typed per key and mirror the backend's `BusinessConfig` rules. A stored value with an unexpected shape is shown read-only and is never overwritten.
- Dates are shown in the admin's local time zone and sent as UTC ISO-8601.

The dashboard uses only real data. The API has no aggregate endpoints, so the dashboard reads counts from `totalItems` of one-item pages (users, banned users, payouts by status). It also shows recent audit entries, an economy snapshot from `/admin/config`, and actuator health (`/actuator/health` and `/readiness`; the backend hides the details).

Endpoints the backend does not provide limit some screens:

- Offers and products always belong to a store, so their pages ask you to pick a merchant first.
- There is no endpoint that lists cashback orders. The Cashback page records, confirms and cancels orders, and lists only the orders handled since the page was opened.
- Payouts and audit entries contain user ids but no names. The ids link to the user page.

## Ads

The **Ads** sidebar group manages the ad system of the Android app (see `ADS_BACKEND_CHANGES.md`):

| Page                                                                                                                 | API                                                                   |
| -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Ads Overview (`/admin/ads`) — claim and callback stats with a date range; the dashboard shows the last 7 days        | `GET /admin/ads/stats`                                                |
| Ad Settings — networks, shares, unit ids, interstitial pacing, placement switches, ad verification, captcha cooldown | `GET`/`PUT /admin/ads/config`                                         |
| Settings History — every saved version with its changes, and restore                                                 | `GET /admin/ads/config/history`, `POST …/{version}/restore`           |
| Reward Claims — claim log for support tickets, with manual credit                                                    | `GET /admin/reward-claims`, `POST /admin/reward-claims/{id}/complete` |
| Callback Log — AdMob / Unity verification callbacks, rejected ones highlighted                                       | `GET /admin/ads/callbacks`                                            |

Saving sends back the `version` that was loaded; if another admin saved in between, the backend answers `409 VERSION_CONFLICT` and the page offers to reload. The Unity S2S secret is write-only: leave the field empty to keep the saved secret, tick “Remove the saved secret” to clear it. Changes reach users the next time they open the app. The AdMob **app** id is part of the app build, not of these settings.

## Scripts

| Command                           | What it does                                           |
| --------------------------------- | ------------------------------------------------------ |
| `npm run dev`                     | Development server with the API proxy                  |
| `npm run build`                   | Type-check, then build to `dist/`                      |
| `npm run preview`                 | Serve the production build locally                     |
| `npm run lint`                    | ESLint (typescript-eslint, react-hooks, react-refresh) |
| `npm run typecheck`               | `tsc` with no output files                             |
| `npm run format` / `format:check` | Prettier (Tailwind class sorting)                      |
| `npm test` / `test:watch`         | Vitest                                                 |

## Testing

The tests cover:

- envelope and error parsing
- the token-refresh interceptor: single refresh for concurrent 401s, session end on refresh failure, the 403 signal
- Zod schemas: banner dates and gradients, article content, quiz single-choice rules, merchant `{subId}`, product prices and ratings, spreadsheet import, configuration
- route guards
- these flows: ban user, complete and fail a payout (including a 409 on an already-settled payout), product creation with server field errors, saving the check-in configuration, and the confirm dialog

```bash
npm test
```

## Deployment

1. Set `VITE_API_BASE_URL` (and `VITE_GOOGLE_CLIENT_ID`) for the target environment, then run `npm run build`.
2. Serve `dist/` as a single-page app. Unknown paths must fall back to `index.html`.
3. Put the panel behind the same origin as the API (see [API configuration and CORS](#api-configuration-and-cors)).
4. Add the panel's origin to the Google OAuth client's **Authorized JavaScript origins**.
5. Recommended headers: a strict `Content-Security-Policy` that allows `accounts.google.com` and `ik.imagekit.io` images, plus `X-Frame-Options: DENY`.
