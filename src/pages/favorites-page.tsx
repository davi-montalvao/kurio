import { useQuery } from '@tanstack/react-query'
import { MobileNftCard } from '../components/home/mobile-nft-card'
import { MobileTabBar } from '../components/home/mobile-tab-bar'
import { NftCard } from '../components/home/nft-card'
import { Footer } from '../components/footer'
import { SiteHeader } from '../components/site-header'
import { api } from '../lib/api'
import { useRequireSession } from '../lib/require-session'
import type { NftSummary } from '../types/nft'

export function FavoritesPage() {
  const session = useRequireSession()
  const favorites = useQuery({
    queryKey: ['favorites'],
    enabled: Boolean(session.data),
    queryFn: async () => {
      const response = await api.get<{ items: NftSummary[] }>('/favorites')
      return response.data
    },
  })
  const items = favorites.data?.items ?? []

  if (session.isPending || !session.data) {
    return (
      <div className="hidden min-h-svh bg-kbg md:block">
        <SiteHeader />
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-ink text-white">
      <div className="hidden lg:block">
        <SiteHeader />
      </div>
      <main className="mx-auto max-w-[1120px] px-4 pt-6 pb-40 lg:px-6 lg:pb-16">
        <h1 className="text-lg font-semibold">Lista de interesse</h1>
        {favorites.isPending ? (
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="skeleton aspect-square rounded-2xl" />
            <div className="skeleton aspect-square rounded-2xl" />
          </div>
        ) : null}
        {favorites.isError ? (
          <p className="mt-6" role="alert">
            Não foi possível carregar a lista de interesse.
          </p>
        ) : null}
        {favorites.data && items.length === 0 ? (
          <p className="mt-6 text-sm text-sand">Nenhum item na lista de interesse.</p>
        ) : null}
        {items.length > 0 ? (
          <ul className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {items.map((nft) => (
              <li key={nft.id}>
                <div className="lg:hidden">
                  <MobileNftCard nft={nft} />
                </div>
                <div className="hidden lg:block">
                  <NftCard nft={nft} />
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </main>
      <MobileTabBar />
      <Footer />
    </div>
  )
}
