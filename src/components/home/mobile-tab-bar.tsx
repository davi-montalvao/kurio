import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { api } from '../../lib/api'
import { cartQueryOptions } from '../../queries/cart'
import type { SessionUser } from '../../types/auth'
import {
  HeartFilledIcon,
  HomeIcon,
  ScanIcon,
  ShopIcon,
  TabBarBackground,
  UserFilledIcon,
} from '../icons/MobileIcons'
import { cn } from '../../lib/cn'

const privatePaths = ['/favoritos', '/perfil'] as const

export function MobileTabBar() {
  const navigate = useNavigate()
  const cart = useQuery(cartQueryOptions())
  const count = cart.data?.count ?? 0
  const session = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const response = await api.get<{ user: SessionUser | null }>('/session')
      return response.data.user
    },
  })
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const loggedIn = Boolean(session.data)

  function destination(path: '/' | '/favoritos' | '/carrinho' | '/perfil') {
    if (loggedIn || !privatePaths.includes(path as '/favoritos' | '/perfil')) {
      return { to: path } as const
    }
    return { to: '/entrar' as const, search: { redirect: path } }
  }

  function openFilters() {
    if (pathname === '/') {
      window.dispatchEvent(new CustomEvent('kurio:open-filters'))
      return
    }
    void navigate({ to: '/' }).then(() => {
      window.dispatchEvent(new CustomEvent('kurio:open-filters'))
    })
  }

  const itemClass = (active: boolean) =>
    cn('relative grid justify-items-center', active ? 'text-kaccent' : 'text-kmuted')

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 md:hidden"
      aria-label="Móvel"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="relative h-[135px] w-full text-ksurface">
        <TabBarBackground className="pointer-events-none absolute inset-0 h-full w-full" />
        <button
          type="button"
          aria-label="Abrir busca e filtros"
          className="absolute top-[8px] left-1/2 grid size-[65px] -translate-x-1/2 place-items-center rounded-full bg-gradient-fab text-ktext shadow-mobile"
          onClick={openFilters}
        >
          <ScanIcon size={27} />
        </button>
        <div className="absolute inset-x-0 top-[71px] grid grid-cols-5">
          <Link
            to="/"
            aria-label="Início"
            aria-current={pathname === '/' ? 'page' : undefined}
            className={itemClass(pathname === '/')}
          >
            <HomeIcon size={20} />
          </Link>
          <Link
            {...destination('/favoritos')}
            aria-label="Favoritos"
            aria-current={pathname === '/favoritos' ? 'page' : undefined}
            className={itemClass(pathname === '/favoritos')}
          >
            <HeartFilledIcon size={20} />
          </Link>
          <span />
          <Link
            to="/carrinho"
            aria-label={count > 0 ? `Carrinho, ${count} itens` : 'Carrinho'}
            aria-current={pathname === '/carrinho' ? 'page' : undefined}
            className={itemClass(pathname === '/carrinho')}
          >
            <span className="relative">
              <ShopIcon size={20} />
              {count > 0 ? (
                <span className="absolute -top-2 -right-3 grid min-w-4 place-items-center rounded-full bg-kprimary px-1 text-[10px] leading-4 font-bold text-kbg">
                  {count}
                </span>
              ) : null}
            </span>
          </Link>
          <Link
            {...destination('/perfil')}
            aria-label="Perfil"
            aria-current={pathname.startsWith('/perfil') ? 'page' : undefined}
            className={itemClass(pathname.startsWith('/perfil'))}
          >
            <UserFilledIcon size={20} />
          </Link>
        </div>
      </div>
    </nav>
  )
}
