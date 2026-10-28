import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router'
import { AccountLayout } from './components/account/account-layout'
import { CartPage } from './pages/cart-page'
import { FavoritesPage } from './pages/favorites-page'
import { HomePage } from './pages/home-page'
import { AuthModal } from './components/auth-dialog'
import { AuthEntry, LoginPage } from './pages/login-page'
import { readAuthSearch } from './types/auth-search'
import { NftPage } from './pages/nft-page'
import { OrderPage } from './pages/order-page'
import { PaymentPage } from './pages/payment-page'
import { ProfilePage } from './pages/profile-page'
import { SoonPage } from './pages/soon-page'
import { WalletsPage } from './pages/wallets-page'
import { validateCatalogSearch } from './types/catalog-search'

const rootRoute = createRootRoute({
  validateSearch: readAuthSearch,
  component: () => (
    <>
      <Outlet />
      <AuthModal />
    </>
  ),
  notFoundComponent: () => (
    <main className="min-h-svh bg-ink px-6 py-10 text-white">
      <h1 className="text-2xl font-medium">Página não encontrada</h1>
    </main>
  ),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: (search: Record<string, unknown>) => ({
    ...validateCatalogSearch(search),
    ...readAuthSearch(search),
  }),
  component: HomePage,
})

const nftRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/nfts/$nftId',
  validateSearch: readAuthSearch,
  component: NftPage,
})

const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/carrinho',
  component: CartPage,
})

const favoritesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/favoritos',
  validateSearch: readAuthSearch,
  component: FavoritesPage,
})

const paymentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pagamento',
  validateSearch: readAuthSearch,
  component: PaymentPage,
})

const orderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pedidos/$orderId',
  validateSearch: readAuthSearch,
  component: OrderPage,
})

const redirectSearch = (search: Record<string, unknown>) => {
  const auth = readAuthSearch(search)
  return {
    redirect: auth.redirect,
    ...(auth.reason ? { reason: auth.reason } : {}),
  }
}

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/entrar',
  validateSearch: redirectSearch,
  component: LoginPage,
})

const loginAliasRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch: redirectSearch,
  component: () => <AuthEntry mode="login" />,
})

const signupAliasRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cadastro',
  validateSearch: redirectSearch,
  component: () => <AuthEntry mode="signup" />,
})

const accountRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/perfil',
  component: AccountLayout,
})

const profileRoute = createRoute({
  getParentRoute: () => accountRoute,
  path: '/',
  component: ProfilePage,
})

const walletsRoute = createRoute({
  getParentRoute: () => accountRoute,
  path: 'carteiras',
  component: WalletsPage,
})

const soonRoute = createRoute({
  getParentRoute: () => accountRoute,
  path: '$section',
  component: SoonPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  nftRoute,
  cartRoute,
  favoritesRoute,
  paymentRoute,
  orderRoute,
  loginRoute,
  loginAliasRoute,
  signupAliasRoute,
  accountRoute.addChildren([profileRoute, walletsRoute, soonRoute]),
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
