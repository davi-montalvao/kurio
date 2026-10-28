import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { api } from '../../lib/api'
import { cn } from '../../lib/cn'
import type { CatalogSearch } from '../../types/catalog-search'
import { collections, networks, type NftListResponse } from '../../types/nft'
import { Sheet } from '../ui/sheet'
import { CatalogFilters } from './catalog-filters'
import { MobileNftCard } from './mobile-nft-card'
import { NftCard, NftCardSkeleton } from './nft-card'

const tabs = [
  { id: 'todos', label: 'Todos os NFTs' },
  { id: 'novos', label: 'Novos lançamentos' },
  { id: 'alta', label: 'Em alta' },
] as const

function toggleValue(list: string[] | undefined, id: string) {
  const current = list ?? []
  const next = current.includes(id)
    ? current.filter((item) => item !== id)
    : [...current, id]

  return next.length ? next : undefined
}

type CatalogSectionProps = {
  filtersOpen: boolean
  onCloseFilters: () => void
}

export function CatalogSection({ filtersOpen, onCloseFilters }: CatalogSectionProps) {
  const search = useSearch({ from: '/' })
  const navigate = useNavigate({ from: '/' })
  const [min, setMin] = useState(search.precoMin ?? '0.02')
  const [max, setMax] = useState(search.precoMax ?? '12.30')

  const catalogSearch = {
    q: search.q,
    colecao: search.colecao,
    rede: search.rede,
    precoMin: search.precoMin,
    precoMax: search.precoMax,
    ordenar: search.ordenar,
    aba: search.aba,
    pagina: search.pagina,
  }
  const catalog = useQuery({
    queryKey: ['nfts', catalogSearch],
    retry: false,
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) => {
      const response = await api.get<NftListResponse>('/nfts', {
        params: catalogSearch,
        signal,
      })
      return response.data
    },
  })

  function updateSearch(patch: Partial<CatalogSearch>, resetPage = false) {
    navigate({
      resetScroll: false,
      search: (current) => ({
        ...current,
        ...patch,
        ...(resetPage ? { pagina: undefined } : {}),
      }),
    }).then(() => {
      document.getElementById('catalogo')?.scrollIntoView()
    })
  }

  const data = catalog.data
  const items = Array.isArray(data?.items) ? data.items : null
  const totalPages =
    typeof data?.total === 'number' && data.pageSize
      ? Math.ceil(data.total / data.pageSize)
      : 0
  const currentPage = data?.page ?? search.pagina ?? 1
  const visiblePages = Array.from(
    { length: Math.min(4, totalPages) },
    (_, index) => {
      const start = Math.min(Math.max(currentPage - 1, 1), Math.max(totalPages - 3, 1))
      return start + index
    },
  ).filter((page) => page <= totalPages)

  return (
    <section id="catalogo" className="mx-auto max-w-[1120px] px-6 pb-40 font-mono md:pb-0 lg:mt-24 lg:max-w-[1200px] lg:px-0">
      <Sheet
        open={filtersOpen}
        title="Filtros"
        onClose={onCloseFilters}
        className="m-auto w-[min(100%-32px,420px)] max-h-[70vh] overflow-auto bg-kbg p-4 text-ktext"
      >
        <div className="max-h-[70vh] overflow-auto">
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                className="text-sm font-bold text-kprimary"
                onClick={onCloseFilters}
              >
                Fechar
              </button>
            </div>
            <CatalogFilters
              collections={data?.facets?.collections ?? collections.map((item) => ({ ...item, count: 0 }))}
              networks={data?.facets?.networks ?? networks.map((item) => ({ ...item, count: 0 }))}
              selectedCollections={search.colecao ?? []}
              selectedNetworks={search.rede ?? []}
              min={min}
              max={max}
              onToggleCollection={(id) =>
                updateSearch({ colecao: toggleValue(search.colecao, id) }, true)
              }
              onToggleNetwork={(id) =>
                updateSearch({ rede: toggleValue(search.rede, id) }, true)
              }
              onPriceChange={(nextMin, nextMax) => {
                setMin(nextMin)
                setMax(nextMax)
              }}
              onApplyPrice={() => updateSearch({ precoMin: min, precoMax: max }, true)}
            />
        </div>
      </Sheet>
      <div className="grid min-w-0 items-start gap-6 md:grid-cols-[240px_minmax(0,1fr)] lg:grid-cols-[310px_minmax(0,1fr)] lg:gap-12">
        <div className="hidden min-w-0 md:block">
          <CatalogFilters
            collections={data?.facets?.collections ?? collections.map((item) => ({ ...item, count: 0 }))}
            networks={data?.facets?.networks ?? networks.map((item) => ({ ...item, count: 0 }))}
            selectedCollections={search.colecao ?? []}
            selectedNetworks={search.rede ?? []}
            min={min}
            max={max}
            onToggleCollection={(id) =>
              updateSearch({ colecao: toggleValue(search.colecao, id) }, true)
            }
            onToggleNetwork={(id) =>
              updateSearch({ rede: toggleValue(search.rede, id) }, true)
            }
            onPriceChange={(nextMin, nextMax) => {
              setMin(nextMin)
              setMax(nextMax)
            }}
            onApplyPrice={() =>
              updateSearch({ precoMin: min, precoMax: max }, true)
            }
            desktop
          />

          {data?.featured ? (
            <Link
              to="/nfts/$nftId"
              params={{ nftId: data.featured.id }}
              className="relative mt-6 flex h-[470px] flex-col gap-4 overflow-hidden bg-[linear-gradient(180deg,rgba(210,138,76,0.10)_0%,rgba(210,138,76,0.03)_100%)] pt-6 pb-1 text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kprimary"
            >
              <p className="px-5 text-2xl leading-8 font-bold text-kaccent">NFT EM DESTAQUE</p>
              <p className="px-5 text-[22px] leading-4 font-bold text-ktext">OFERTA LIMITADA</p>
              <img
                src={data.featured.featuredImage ?? data.featured.image}
                alt=""
                className="h-[368px] w-full rounded-[22px] object-cover"
              />
            </Link>
          ) : null}
        </div>

        <div className="min-w-0">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4 lg:mb-8 lg:h-[18px] lg:items-center">
            <div className="flex gap-3 lg:gap-5" role="tablist" aria-label="Recortes do catálogo">
              {tabs.map((tab) => {
                const selected = (search.aba ?? 'todos') === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    className={cn(
                      'border-b-2 pb-2 text-xs lg:border-b-2 lg:pb-1 lg:text-[15px] lg:leading-4 lg:font-medium',
                      selected
                        ? 'border-kprimary text-kaccent'
                        : 'border-transparent text-sand lg:text-ktext',
                    )}
                    onClick={() =>
                      updateSearch(
                        { aba: tab.id === 'todos' ? undefined : tab.id },
                        true,
                      )
                    }
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>

            <label className="hidden text-sm text-muted md:block lg:text-[15px] lg:text-ktext">
              Ordenar por:{' '}
              <select
                className="bg-transparent text-sand focus-visible:outline focus-visible:outline-2 focus-visible:outline-kprimary lg:text-ktext"
                value={search.ordenar ?? 'recentes'}
                onChange={(event) =>
                  updateSearch(
                    {
                      ordenar:
                        event.target.value === 'recentes'
                          ? undefined
                          : (event.target.value as CatalogSearch['ordenar']),
                    },
                    true,
                  )
                }
              >
                <option value="recentes">Listados recentemente</option>
                <option value="preco-asc">Menor preço</option>
                <option value="preco-desc">Maior preço</option>
              </select>
            </label>
          </div>

          {catalog.isPending ? (
            <ul className="grid grid-cols-2 gap-5 md:grid-cols-3">
              {Array.from({ length: 8 }, (_, index) => (
                <li key={index}>
                  <NftCardSkeleton />
                </li>
              ))}
            </ul>
          ) : null}

          {catalog.isError || (catalog.isSuccess && !items) ? (
            <div className="rounded-xl bg-panel p-6" role="alert">
              <p>Não foi possível carregar o catálogo.</p>
              <button
                type="button"
                className="mt-4 rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-ink"
                onClick={() => catalog.refetch()}
              >
                Tentar de novo
              </button>
            </div>
          ) : null}

          {items?.length === 0 ? (
            <p className="rounded-xl bg-panel p-6 text-sand" role="status">
              Nenhum NFT encontrado com esses filtros.
            </p>
          ) : null}

          {items && items.length > 0 ? (
            <ul
              className="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3 lg:grid-cols-3 lg:justify-between lg:gap-x-8 lg:gap-y-[72px]"
              aria-busy={catalog.isFetching}
            >
              {items.map((nft) => (
                <li key={nft.id}>
                  <div className="md:hidden">
                    <MobileNftCard nft={nft} />
                  </div>
                  <div className="hidden md:block">
                    <NftCard nft={nft} home />
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          {catalog.isFetching && !catalog.isPending ? (
            <p className="sr-only" role="status">
              Atualizando catálogo
            </p>
          ) : null}

          {totalPages > 1 ? (
            <nav
              className="mt-8 flex justify-end gap-2 lg:mt-[88px]"
              aria-label="Paginação do catálogo"
            >
              {visiblePages.map((page) => (
                <button
                  key={page}
                  type="button"
                  aria-current={page === currentPage ? 'page' : undefined}
                  className={cn(
                    'size-8 rounded-md text-sm lg:size-[35px] lg:rounded lg:text-lg',
                    page === currentPage
                      ? 'bg-kprimary font-bold text-kbg'
                      : 'bg-panel text-sand lg:border lg:border-kborder lg:bg-transparent lg:font-normal lg:text-ktext',
                  )}
                  onClick={() =>
                    updateSearch({ pagina: page === 1 ? undefined : page })
                  }
                >
                  {page}
                </button>
              ))}
              {currentPage < totalPages ? (
                <button
                  type="button"
                  className="flex size-8 items-center justify-center rounded-md bg-panel text-sand lg:size-[35px] lg:rounded lg:border lg:border-kborder lg:bg-transparent lg:text-ktext"
                  aria-label="Próxima página"
                  onClick={() => updateSearch({ pagina: currentPage + 1 })}
                >
                  <ChevronRight size={18} strokeWidth={1.5} />
                </button>
              ) : null}
            </nav>
          ) : null}
        </div>
      </div>
    </section>
  )
}
