import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { Heart, LogIn, Search, ShoppingCart, User } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { api } from '../lib/api'
import { cartQueryOptions } from '../queries/cart'
import { cn } from '../lib/cn'
import type { SessionUser } from '../types/auth'
import type { CatalogSearch } from '../types/catalog-search'
import { PriceNotice } from '../lib/realtime'
import { rememberAuthOpener } from './auth-dialog'
import { Button } from './ui/button'

type SiteHeaderProps = {
  active?: 'inicio' | 'mercado'
  line?: boolean
}

export function SiteHeader({ active = 'inicio', line = true }: SiteHeaderProps) {
  const navigate = useNavigate()
  const onHome = useRouterState({
    select: (state) => state.location.pathname === '/',
  })
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const cart = useQuery(cartQueryOptions())
  const count = cart.data?.count ?? 0
  const session = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const response = await api.get<{ user: SessionUser | null }>('/session')
      return response.data.user
    },
  })
  const user = session.data

  function submitSearch(event: FormEvent) {
    event.preventDefault()
    const q = draft.trim() || undefined

    if (onHome) {
      navigate({
        to: '/',
        search: (current: CatalogSearch) => ({
          ...current,
          q,
          pagina: undefined,
        }),
      })
      return
    }

    navigate({ to: '/', search: { q } })
  }

  const itemClass = (item: 'inicio' | 'mercado') =>
    cn(
      'relative inline-flex h-[45px] items-start pt-1 text-base leading-none',
      active === item ? 'font-bold text-kaccent' : 'font-normal text-ktext',
    )

  const mark = <span className="absolute inset-x-0 bottom-0 h-[3px] bg-kprimary" />

  return (
    <header className="mx-auto w-full max-w-[1200px] px-4 pt-6 font-mono xl:px-0">
      <div className="flex items-start justify-between gap-3 xl:gap-6">
        <Link to="/" className="w-28 shrink-0 text-sm font-bold tracking-[0.1em] text-ktext xl:w-40">
          KURIO
        </Link>

        <nav className="flex items-start gap-4 xl:gap-10" aria-label="Principal">
          <Link to="/" className={itemClass('inicio')}>
            Início
            {active === 'inicio' ? mark : null}
          </Link>
          <Link to="/nfts/$nftId" params={{ nftId: 'emerald-ape-042' }} className={itemClass('mercado')}>
            Mercado
            {active === 'mercado' ? mark : null}
          </Link>
          <span className="hidden h-[45px] items-start pt-1 text-base leading-none font-normal text-ktext xl:inline-flex">
            Criadores
          </span>
          <span className="hidden h-[45px] items-start pt-1 text-base leading-none font-normal text-ktext xl:inline-flex">
            Aprenda
          </span>
        </nav>

        <div className="flex items-center gap-3 xl:gap-7">
        <form role="search" className="flex items-center gap-2" onSubmit={submitSearch}>
          {open ? (
            <input
              autoFocus
              value={draft}
              aria-label="Buscar NFTs"
              placeholder="Buscar"
              className="h-9 w-24 rounded-lg border border-line bg-panel px-3 text-sm outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-ember xl:w-36"
              onChange={(event) => setDraft(event.target.value)}
            />
          ) : null}
          <button
            type={open ? 'submit' : 'button'}
            className="text-ktext focus-visible:outline focus-visible:outline-2 focus-visible:outline-kprimary"
            aria-label={open ? 'Buscar' : 'Abrir busca'}
            onClick={() => {
              if (!open) setOpen(true)
            }}
          >
            <Search size={20} />
          </button>
        </form>

        {user ? (
          <Link
            to="/favoritos"
            className="text-ktext focus-visible:outline focus-visible:outline-2 focus-visible:outline-kprimary"
            aria-label="Favoritos"
            aria-current={pathname === '/favoritos' ? 'page' : undefined}
          >
            <Heart size={24} />
          </Link>
        ) : (
          <button
            type="button"
            className="text-ktext focus-visible:outline focus-visible:outline-2 focus-visible:outline-kprimary"
            aria-label="Favoritos"
            onClick={(event) => {
              rememberAuthOpener(event.currentTarget)
              if (window.matchMedia('(max-width: 767px)').matches) {
                void navigate({ to: '/entrar', search: { redirect: '/favoritos' } })
                return
              }
              const url = new URL(window.location.href)
              url.searchParams.set('auth', 'login')
              url.searchParams.set('redirect', '/favoritos')
              void navigate({ href: `${url.pathname}${url.search}` })
            }}
          >
            <Heart size={24} />
          </button>
        )}

        <Link
          to="/carrinho"
          className="relative text-ktext focus-visible:outline focus-visible:outline-2 focus-visible:outline-kprimary"
          aria-label={
            count === 0
              ? 'Carrinho'
              : `Carrinho, ${count} ${count === 1 ? 'item' : 'itens'}`
          }
        >
          <ShoppingCart size={24} />
          {count > 0 ? (
            <span className="absolute -top-2 -right-2 flex size-4 items-center justify-center rounded-full border-2 border-kbg bg-kprimary text-[10px] font-medium text-kbg">
              {count}
            </span>
          ) : null}
        </Link>

        {user ? (
          <Button asChild className="h-[35px] min-w-[100px] gap-1 rounded-md bg-kprimary px-3 text-base font-medium text-kbg hover:opacity-90">
            <Link to="/perfil">
              <User size={20} />
              <span className="max-w-24 truncate xl:max-w-32">{user.displayName || user.username}</span>
            </Link>
          </Button>
        ) : (
          <Button
            className="h-[35px] w-[100px] gap-1 rounded-md bg-kprimary px-0 text-base font-medium text-kbg hover:opacity-90"
            onClick={(event) => {
              rememberAuthOpener(event.currentTarget)
              if (window.matchMedia('(max-width: 767px)').matches) {
                void navigate({ to: '/entrar', search: { redirect: pathname } })
                return
              }
              const url = new URL(window.location.href)
              url.searchParams.set('auth', 'login')
              void navigate({ href: `${url.pathname}${url.search}` })
            }}
          >
            <LogIn size={20} />
            Entrar
          </Button>
        )}
        </div>
      </div>
      {line ? <div className="mt-0 h-px w-full bg-kprimary/30" /> : null}
      <PriceNotice className="mx-auto mt-4 hidden w-[min(440px,92vw)] md:flex" />
    </header>
  )
}
