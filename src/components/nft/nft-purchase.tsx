import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { Heart, Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import { rememberAuthOpener } from '../auth-dialog'
import { api } from '../../lib/api'
import { profileQueryOptions } from '../../queries/profile'
import { cn } from '../../lib/cn'
import { formatEth } from '../../lib/format'
import type { NftDetail, NftEdition } from '../../types/nft'
function QuantityButton({
  label,
  symbol,
  disabled,
  onClick,
}: {
  label: string
  symbol: 'minus' | 'plus'
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className="grid h-[50px] w-[33px] shrink-0 place-items-center rounded-[33px] border border-kbg bg-kprimary text-black shadow-[0_6.6px_19.8px_rgba(20,13,10,0.15)] hover:opacity-90 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kprimary"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      {symbol === 'minus' ? <Minus size={15} strokeWidth={3} /> : <Plus size={15} strokeWidth={3} />}
    </button>
  )
}

function StarRow({ count }: { count: number }) {
  if (count <= 0) return null

  return (
    <p className="flex items-center gap-1 text-[15px] leading-4 text-ktext">
      <span aria-hidden="true">
        <span className="text-kprimary">★★★★</span>
        <span className="text-kmuted">★</span>
      </span>
      {count} avaliações de colecionadores
    </p>
  )
}

export function NftPurchase({ nft, mobile = false }: { nft: NftDetail; mobile?: boolean }) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const navigate = useNavigate()
  const session = useQuery(profileQueryOptions())
  const [editionId, setEditionId] = useState('1-50')
  const [quantity, setQuantity] = useState(1)
  const [notice, setNotice] = useState('')
  const edition =
    nft.editions.find((item) => item.id === editionId) ?? nft.editions[0]

  const favorite = useMutation({
    mutationFn: async (next: boolean) => {
      if (next) {
        await api.post(`/favorites/${nft.id}`)
        return
      }
      await api.delete(`/favorites/${nft.id}`)
    },
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: ['nft', nft.id] })
      const previous = queryClient.getQueryData<NftDetail>(['nft', nft.id])
      queryClient.setQueryData<NftDetail>(['nft', nft.id], (current) =>
        current ? { ...current, favorite: next } : current,
      )
      return { previous }
    },
    onError: (_error, _next, context) => {
      queryClient.setQueryData(['nft', nft.id], context?.previous)
      setNotice('Não foi possível atualizar o favorito.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['nft', nft.id] })
    },
  })

  const buy = useMutation({
    mutationFn: async () => {
      const response = await api.post<{ count: number }>('/cart', {
        nftId: nft.id,
        editionId: edition?.id,
        quantity,
      })
      return response.data
    },
    onSuccess: async () => {
      setNotice('Adicionado ao carrinho.')
      await queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      setNotice(error.response?.data?.message ?? 'Não foi possível comprar.')
    },
  })

  function openLogin(opener: HTMLElement) {
    rememberAuthOpener(opener)
    const back = `/nfts/${nft.id}`
    if (window.matchMedia('(max-width: 767px)').matches) {
      void navigate({ to: '/entrar', search: { redirect: back } })
      return
    }
    const url = new URL(window.location.href)
    url.searchParams.set('auth', 'login')
    url.searchParams.set('redirect', back)
    void navigate({ href: `${url.pathname}${url.search}` })
  }

  function chooseEdition(next: NftEdition) {
    if (!next.available) return
    setEditionId(next.id)
    setQuantity((current) => Math.min(current, next.maxQuantity))
    setNotice('')
  }

  if (!edition) return null

  if (mobile) {
    const about =
      nft.id === 'emerald-ape-042'
        ? `Um colecionável digital ${edition.label} finalizado à mão da coleção Kurio Editions, verificado na Ethereum.`
        : nft.about

    return (
      <article className="flex h-svh flex-col overflow-hidden bg-surface-card">
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="shrink-0"
            aria-label="Voltar"
            onClick={() => {
              if (window.history.length > 1) {
                router.history.back()
                return
              }
              navigate({ to: '/' })
            }}
          >
            <svg
              width="35"
              height="35"
              viewBox="0 0 35 35"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <rect x="0.5" y="0.5" width="34" height="34" rx="17" fill="#2F1D15" />
              <rect x="0.5" y="0.5" width="34" height="34" rx="17" stroke="#3F2319" />
              <path
                d="M20.9167 23.8332C20.9167 23.8332 15.0834 20.3798 15.0834 17.9998C15.0834 15.6207 20.9167 12.1665 20.9167 12.1665"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                stroke="#CFB28C"
              />
            </svg>
          </button>
          <button
            type="button"
            className="shrink-0"
            aria-pressed={nft.favorite}
            aria-label={nft.favorite ? 'Remover dos favoritos' : 'Favoritar'}
            onClick={(event) => {
              if (!session.data) {
                openLogin(event.currentTarget)
                return
              }
              favorite.mutate(!nft.favorite)
            }}
          >
            <svg
              width="35"
              height="35"
              viewBox="0 0 35 35"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <rect x="0.5" y="0.5" width="34" height="34" rx="17" fill="#2F1D15" />
              <rect x="0.5" y="0.5" width="34" height="34" rx="17" stroke="#3F2319" />
              <path
                d="M17.5 24.6177C17.2722 24.6177 17.0526 24.5352 16.8815 24.3853C16.2351 23.8201 15.6119 23.2889 15.0621 22.8204L15.0593 22.818C13.4474 21.4443 12.0554 20.2581 11.0869 19.0895C10.0043 17.7831 9.5 16.5444 9.5 15.1913C9.5 13.8766 9.95081 12.6637 10.7693 11.7759C11.5975 10.8776 12.734 10.3828 13.9697 10.3828C14.8933 10.3828 15.7391 10.6748 16.4836 11.2506C16.8594 11.5413 17.2 11.897 17.5 12.3119C17.8002 11.897 18.1406 11.5413 18.5165 11.2506C19.261 10.6748 20.1068 10.3828 21.0304 10.3828C22.266 10.3828 23.4026 10.8776 24.2308 11.7759C25.0493 12.6637 25.5 13.8766 25.5 15.1913C25.5 16.5444 24.9958 17.7831 23.9132 19.0894C22.9447 20.2581 21.5529 21.4442 19.9412 22.8177C19.3904 23.287 18.7662 23.819 18.1184 24.3855C17.9474 24.5352 17.7277 24.6177 17.5 24.6177V24.6177ZM13.9697 11.3201C12.9989 11.3201 12.1071 11.7075 11.4583 12.4111C10.7998 13.1254 10.4371 14.1127 10.4371 15.1913C10.4371 16.3293 10.8601 17.3472 11.8085 18.4915C12.7251 19.5975 14.0885 20.7594 15.6671 22.1047L15.67 22.1072C16.2219 22.5775 16.8475 23.1107 17.4987 23.6801C18.1537 23.1096 18.7803 22.5756 19.3333 22.1045C20.9117 20.7592 22.275 19.5975 23.1917 18.4915C24.1399 17.3472 24.5629 16.3293 24.5629 15.1913C24.5629 14.1127 24.2002 13.1254 23.5417 12.4111C22.8931 11.7075 22.0011 11.3201 21.0304 11.3201C20.3192 11.3201 19.6663 11.5461 19.0897 11.9919C18.5759 12.3894 18.218 12.8918 18.0082 13.2434C17.9003 13.4242 17.7103 13.5321 17.5 13.5321C17.2897 13.5321 17.0997 13.4242 16.9918 13.2434C16.7821 12.8918 16.4242 12.3894 15.9103 11.9919C15.3337 11.5461 14.6808 11.3201 13.9697 11.3201V11.3201Z"
                fill="#E89B55"
              />
            </svg>
          </button>
        </div>

        <img
          src={nft.image}
          alt=""
          className="mx-auto mt-4 aspect-square w-full rounded-2xl object-cover md:size-[280px]"
        />

        <div className="mt-4 flex items-start justify-between gap-3">
          <h1 className="text-xl font-semibold">{nft.name}</h1>
          {nft.reviewCount > 0 ? (
            <p className="shrink-0 rounded-full border border-[#E89B55]/50 px-2 py-1 text-xs text-[#E7D3C2]">
              <span className="text-[#E89B55]" aria-hidden="true">
                ★
              </span>{' '}
              4.8 ({nft.reviewCount})
            </p>
          ) : null}
        </div>

        <p className="mt-3 text-sm leading-relaxed text-sand">{about}</p>

        <div className="mt-4">
          <p className="text-sm font-semibold">Edição:</p>
          <div className="mt-2 flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Edição">
            {nft.editions.map((item) => {
              const selected = item.id === edition.id
              return (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={!item.available}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs',
                    selected ? 'border-[#E89B55] text-white' : 'border-[#6b5346] text-[#E7D3C2]',
                    !item.available && 'cursor-not-allowed opacity-40',
                  )}
                  onClick={() => chooseEdition(item)}
                >
                  {item.label}
                  {!item.available ? <span className="sr-only">, indisponível</span> : null}
                </button>
              )
            })}
            <span className="rounded-full border border-[#6b5346] px-3 py-1 text-xs tracking-wide text-[#E7D3C2]">
              {edition.available ? 'ABERTA' : 'ESGOTADA'}
            </span>
          </div>
        </div>

        <dl className="mt-4 space-y-1 text-sm text-[#E7D3C2]">
          <div>
            <dt className="inline">ID do token: </dt>
            <dd className="inline">{nft.tokenId}</dd>
          </div>
          <div>
            <dt className="inline">Coleção: </dt>
            <dd className="inline">{nft.collectionName}</dd>
          </div>
          <div>
            <dt className="inline">Atributos: </dt>
            <dd className="inline">{nft.attributes.join(', ')}</dd>
          </div>
          </dl>
        </div>

        <div className="relative z-10 shrink-0 rounded-t-[32px] bg-[#2A1A16] px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-12px_28px_rgba(10,6,4,0.55)]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-sm text-[#C9A27A]">Qtd.</span>
              <button
                type="button"
                className="grid h-9 w-7 place-items-center rounded-full bg-[#E89B55] text-[#1A100C] disabled:opacity-40"
                aria-label="Diminuir quantidade"
                disabled={quantity <= 1}
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
              >
                <Minus size={14} strokeWidth={2.4} />
              </button>
              <span className="min-w-4 text-center text-base font-semibold" aria-live="polite">
                {quantity}
              </span>
              <button
                type="button"
                className="grid h-9 w-7 place-items-center rounded-full bg-[#E89B55] text-[#1A100C] disabled:opacity-40"
                aria-label="Aumentar quantidade"
                disabled={quantity >= edition.maxQuantity}
                onClick={() =>
                  setQuantity((current) => Math.min(edition.maxQuantity, current + 1))
                }
              >
                <Plus size={14} strokeWidth={2.4} />
              </button>
            </div>
            <p className="text-xl font-bold text-[#E89B55]">{nft.priceEth} ETH</p>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-[60px] w-[196px] shrink-0 items-center justify-center gap-[10px] rounded-[40px] bg-[#E89B55] pt-5 pr-[44px] pb-5 pl-12 text-base font-bold leading-none text-[#1A100C] disabled:opacity-50"
              disabled={!edition.available || buy.isPending}
              onClick={() => buy.mutate()}
            >
              Comprar NFT
            </button>
            <Link to="/carrinho" aria-label="Carrinho" className="shrink-0">
              <svg
                width="60"
                height="60"
                viewBox="0 0 60 60"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <rect x="0.5" y="0.5" width="59" height="59" rx="29.5" fill="#2F1D15" />
                <rect x="0.5" y="0.5" width="59" height="59" rx="29.5" stroke="#3F2319" />
                <path
                  d="M38.3334 26.8012L37.3897 32.7776C37.2182 33.9561 36.2745 34.7136 35.0736 34.7136H26.8383C25.7231 34.7136 24.6937 33.8719 24.5221 32.7776L23.4927 25.7911L23.2353 23.8551C23.1496 23.35 22.7206 23.0133 22.1201 23.0133H21.5196C21.1765 23.0133 20.8334 22.6766 20.8334 22.3399C20.8334 22.0032 21.1765 21.6665 21.5196 21.6665H22.1201C23.3211 21.6665 24.3505 22.5083 24.4363 23.6867L24.6079 25.0335H36.7893C37.2182 25.0335 37.6471 25.2019 37.9045 25.5386C38.2476 25.8753 38.3334 26.3803 38.3334 26.8012Z"
                  fill="#B39463"
                />
                <path
                  d="M35.2451 38.3332C35.7189 38.3332 36.103 37.9563 36.103 37.4914C36.103 37.0265 35.7189 36.6497 35.2451 36.6497C34.7714 36.6497 34.3873 37.0265 34.3873 37.4914C34.3873 37.9563 34.7714 38.3332 35.2451 38.3332Z"
                  fill="#B39463"
                />
                <path
                  d="M26.6667 38.3332C27.1405 38.3332 27.5246 37.9563 27.5246 37.4914C27.5246 37.0265 27.1405 36.6497 26.6667 36.6497C26.1929 36.6497 25.8089 37.0265 25.8089 37.4914C25.8089 37.9563 26.1929 38.3332 26.6667 38.3332Z"
                  fill="#B39463"
                />
              </svg>
            </Link>
          </div>

          {notice ? (
            <p className="mt-3 text-sm text-sand" role="status">
              {notice}
            </p>
          ) : null}
        </div>
      </article>
    )
  }

  return (
    <div className="flex h-[448px] flex-col justify-between gap-5 font-mono">
      <div className="flex flex-col gap-3">
        <h1 className="text-[28px] font-bold text-ktext">{nft.name}</h1>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[22px] leading-4 font-bold text-kaccent">
            {formatEth(nft.priceEth)} ETH
          </p>
          <StarRow count={nft.reviewCount} />
        </div>
        <div className="h-px w-full bg-kprimary/30" />
      </div>

      <div className="flex max-w-[574px] flex-col gap-3">
        <h2 className="text-[15px] leading-4 font-bold text-ktext">Sobre este NFT:</h2>
        <p className="text-sm leading-6 text-kmuted">{nft.about}</p>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-[15px] leading-4 font-bold text-ktext">Edição:</p>
        <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label="Edição">
          {nft.editions.map((item) => {
            const selected = item.id === edition.id
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={!item.available}
                className={cn(
                  'inline-flex h-7 items-center rounded-full border px-2 text-sm leading-4',
                  selected
                    ? 'border-kprimary font-medium text-kaccent'
                    : 'border-kborder text-kmuted hover:border-kprimary',
                  !item.available && 'cursor-not-allowed opacity-40',
                )}
                onClick={() => chooseEdition(item)}
              >
                {item.label}
                {!item.available ? <span className="sr-only">, indisponível</span> : null}
              </button>
            )
          })}
          <span className="inline-flex h-7 items-center rounded-full border border-kborder px-2 text-sm leading-4 text-kmuted">
            {edition.available ? 'ABERTA' : 'ESGOTADA'}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <QuantityButton
            label="Diminuir quantidade"
            symbol="minus"
            disabled={quantity <= 1}
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
          />
          <span className="min-w-4 text-center text-xl leading-7 text-ktext" aria-live="polite">
            {quantity}
          </span>
          <QuantityButton
            label="Aumentar quantidade"
            symbol="plus"
            disabled={quantity >= edition.maxQuantity}
            onClick={() =>
              setQuantity((current) => Math.min(edition.maxQuantity, current + 1))
            }
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-10 w-[130px] items-center justify-center rounded-md bg-kprimary text-sm leading-5 font-bold text-kbg uppercase hover:opacity-90 disabled:opacity-50"
            disabled={!edition.available || buy.isPending}
            onClick={() => buy.mutate()}
          >
            Comprar
          </button>
          <button
            type="button"
            className="inline-flex h-10 w-[130px] items-center justify-center gap-2 rounded-md border border-kprimary bg-transparent text-sm leading-5 font-medium text-kaccent hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kprimary"
            aria-pressed={nft.favorite}
            onClick={(event) => {
              if (!session.data) {
                openLogin(event.currentTarget)
                return
              }
              favorite.mutate(!nft.favorite)
            }}
          >
            <Heart size={20} fill={nft.favorite ? 'currentColor' : 'none'} />
            Favoritar
          </button>
        </div>
      </div>

      {notice ? (
        <p className="text-sm text-kmuted" role="status">
          {notice}
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
      <dl className="flex flex-col gap-3 text-[15px] leading-4 text-kplaceholder">
        <div>
          <dt className="inline">ID do token: </dt>
          <dd className="inline">{nft.tokenId}</dd>
        </div>
        <div>
          <dt className="inline">Coleção: </dt>
          <dd className="inline">{nft.collectionName}</dd>
        </div>
        <div>
          <dt className="inline">Atributos: </dt>
          <dd className="inline">{nft.attributes.join(', ')}</dd>
        </div>
      </dl>

      <div className="flex items-center gap-2 text-[15px] leading-4 text-ktext">
        <span className="font-bold">Compartilhar este NFT:</span>
        <ShareButton label="Copiar link para o LinkedIn" glyph="in" />
        <ShareButton label="Copiar link para o e-mail" glyph="✉" />
        <ShareButton label="Copiar link para o X" glyph="𝕏" />
      </div>
      </div>
    </div>
  )
}

function ShareButton({ label, glyph }: { label: string; glyph: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <button
      type="button"
      className="text-ktext hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-kprimary"
      aria-label={copied ? 'Link copiado' : label}
      onClick={async () => {
        await navigator.clipboard.writeText(window.location.href)
        setCopied(true)
      }}
    >
      {glyph}
    </button>
  )
}
