import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { MobileCart } from '../components/cart/mobile-cart'
import { Footer } from '../components/footer'
import { NftCard } from '../components/home/nft-card'
import { SiteHeader } from '../components/site-header'
import { api } from '../lib/api'
import { cartQueryOptions } from '../queries/cart'
import type { CartErrorBody, CartItem, CartResponse } from '../types/cart'

function money(value: string) {
  return `${value} ETH`
}

function errorMessage(error: { response?: { data?: CartErrorBody } }, fallback: string) {
  return error.response?.data?.message ?? fallback
}

export function CartPage() {
  const queryClient = useQueryClient()
  const [code, setCode] = useState('')
  const [couponMessage, setCouponMessage] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const cart = useQuery(cartQueryOptions())

  function saveCart(next: CartResponse) {
    queryClient.setQueryData(['cart'], next)
  }

  const updateQuantity = useMutation({
    mutationFn: async (item: { nftId: string; editionId: string; quantity: number }) => {
      const response = await api.patch<CartResponse>('/cart', item)
      return response.data
    },
    onMutate: () => setActionMessage(''),
    onSuccess: saveCart,
    onError: (error: { response?: { data?: CartErrorBody } }) => {
      setActionMessage(errorMessage(error, 'Não foi possível atualizar a quantidade.'))
    },
  })

  const removeItem = useMutation({
    mutationFn: async (item: { nftId: string; editionId: string }) => {
      const response = await api.delete<CartResponse>('/cart', { data: item })
      return response.data
    },
    onMutate: () => setActionMessage(''),
    onSuccess: saveCart,
    onError: (error: { response?: { data?: CartErrorBody } }) => {
      setActionMessage(errorMessage(error, 'Não foi possível remover o item.'))
    },
  })

  const applyCoupon = useMutation({
    mutationFn: async (nextCode: string) => {
      const response = await api.post<CartResponse>('/cart/coupon', { code: nextCode })
      return response.data
    },
    onSuccess: (next) => {
      saveCart(next)
      setCouponMessage('')
      setCode('')
    },
    onError: (error: { response?: { data?: CartErrorBody } }) => {
      setCouponMessage(errorMessage(error, 'Cupom inválido'))
    },
  })

  const removeCoupon = useMutation({
    mutationFn: async () => {
      const response = await api.delete<CartResponse>('/cart/coupon')
      return response.data
    },
    onSuccess: (next) => {
      saveCart(next)
      setCouponMessage('')
    },
  })

  const data = cart.data
  const items = Array.isArray(data?.items) ? data.items : null
  const suggestions = Array.isArray(data?.suggestions) ? data.suggestions : []
  const quote = data?.quote

  return (
    <div className="min-h-svh bg-ink text-white lg:bg-kbg lg:text-ktext">
      <div className="hidden lg:block">
        <SiteHeader active="mercado" line={false} />
      </div>
      <MobileCart
        items={items ?? []}
        quote={quote}
        loading={cart.isPending}
        error={cart.isError}
        couponCode={code}
        couponMessage={couponMessage}
        actionMessage={actionMessage}
        itemsPending={updateQuantity.isPending || removeItem.isPending}
        couponPending={applyCoupon.isPending}
        onRetry={() => cart.refetch()}
        onCouponCode={setCode}
        onApplyCoupon={() => applyCoupon.mutate(code)}
        onRemoveCoupon={() => removeCoupon.mutate()}
        onQuantity={(item, quantity) =>
          updateQuantity.mutate({ nftId: item.nftId, editionId: item.editionId, quantity })
        }
        onRemove={(item) => removeItem.mutate({ nftId: item.nftId, editionId: item.editionId })}
      />
      <main className="mx-auto hidden max-w-[1120px] px-4 pt-6 pb-40 font-mono lg:mt-8 lg:block lg:max-w-[1200px] lg:px-0 lg:pt-0 lg:pb-24">
        <p className="text-[15px] leading-4 font-bold text-ktext">
          <Link to="/" className="hover:text-kaccent">Início</Link>
          <span> / </span>
          <Link to="/" hash="catalogo" className="hover:text-kaccent">Mercado</Link>
          <span> / Carrinho</span>
        </p>

        {cart.isPending ? (
          <div className="mt-8 space-y-3">
            <div className="skeleton h-20 rounded-xl" />
            <div className="skeleton h-20 rounded-xl" />
            <div className="skeleton h-20 rounded-xl" />
          </div>
        ) : null}

        {cart.isError || (cart.isSuccess && items === null) ? (
          <div className="mt-8" role="alert">
            <p>Não foi possível carregar o carrinho.</p>
            <button
              type="button"
              className="mt-4 text-sm font-semibold text-ember"
              onClick={() => cart.refetch()}
            >
              Tentar de novo
            </button>
          </div>
        ) : null}

        {items?.length === 0 ? (
          <div className="mt-10">
            <h1 className="text-2xl font-semibold">Seu carrinho está vazio</h1>
            <Link to="/" hash="catalogo" className="mt-4 inline-block text-ember">
              Continuar explorando
            </Link>
          </div>
        ) : null}

        {items && items.length > 0 && quote ? (
          <div className="mt-3 flex items-start justify-between gap-8">
            <section className="w-[782px] shrink-0" aria-label="Itens do carrinho">
              <div className="flex flex-col gap-3">
                <div className="flex h-4 items-center justify-between pr-6 text-base leading-4 text-ktext">
                  <span className="w-[250px] font-bold">NFTs</span>
                  <span className="w-[77px] font-medium">Preço</span>
                  <span className="w-[75px] font-bold">Edições</span>
                  <span className="w-[87px] text-right font-medium">Total</span>
                  <span className="w-6">
                    <span className="sr-only">Remover</span>
                  </span>
                </div>
                <div className="h-px bg-kprimary/30" />
                <ul className="flex flex-col gap-3">
                  {items.map((item) => (
                    <CartRow
                      key={`${item.nftId}-${item.editionId}`}
                      item={item}
                      pending={updateQuantity.isPending || removeItem.isPending}
                      onQuantity={(quantity) =>
                        updateQuantity.mutate({
                          nftId: item.nftId,
                          editionId: item.editionId,
                          quantity,
                        })
                      }
                      onRemove={() =>
                        removeItem.mutate({
                          nftId: item.nftId,
                          editionId: item.editionId,
                        })
                      }
                    />
                  ))}
                </ul>
              </div>
            </section>

            <aside className="flex w-[332px] shrink-0 flex-col gap-6">
              <div className="flex flex-col gap-3">
                <h1 className="text-lg leading-4 font-bold text-ktext">Resumo da carteira</h1>
                <div className="h-px bg-kprimary/30" />
              </div>
              <form
                className="flex flex-col gap-2"
                onSubmit={(event) => {
                  event.preventDefault()
                  applyCoupon.mutate(code)
                }}
              >
                <label htmlFor="coupon" className="text-sm leading-4 font-bold text-ktext">
                  Código promocional
                </label>
                <div className="flex h-10 items-center rounded-[3px] border border-kprimary pl-2">
                  <input
                    id="coupon"
                    value={code}
                    placeholder="Digite o código promocional..."
                    className="h-full min-w-0 flex-1 bg-transparent text-xs leading-4 text-ktext outline-none placeholder:text-kplaceholder"
                    onChange={(event) => setCode(event.target.value)}
                  />
                  <button
                    type="submit"
                    className="h-10 w-[102px] shrink-0 rounded-r-[3px] bg-kprimary text-[15px] leading-4 font-bold text-kbg hover:opacity-90 disabled:opacity-50"
                    disabled={applyCoupon.isPending}
                  >
                    Aplicar
                  </button>
                </div>
                {couponMessage ? (
                  <p className="text-xs text-krequired" role="alert">
                    {couponMessage}
                  </p>
                ) : null}
                {quote.coupon ? (
                  <p className="text-sm text-ktext">
                    {quote.coupon}{' '}
                    <button
                      type="button"
                      className="font-bold text-kaccent hover:opacity-90"
                      onClick={() => removeCoupon.mutate()}
                    >
                      Remover
                    </button>
                  </p>
                ) : null}
              </form>

              <dl className="flex flex-col gap-3 text-[15px] leading-4 text-ktext">
                <div className="flex items-center justify-between gap-4">
                  <dt>Subtotal</dt>
                  <dd className="text-lg leading-4">{money(quote.subtotalEth)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>Desconto do lançamento</dt>
                  <dd>(-) {quote.discountEth === '0.00' ? '00.00' : quote.discountEth}</dd>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-4">
                    <dt>Taxa de rede</dt>
                    <dd className="text-lg leading-4">{money(quote.feeEth)}</dd>
                  </div>
                  <p className="text-right text-xs leading-4 text-kaccent">Taxa estimada</p>
                </div>
              </dl>

              <div className="flex items-center justify-between gap-4">
                <p className="text-base leading-4 font-bold text-ktext">Total</p>
                <p className="text-lg leading-4 font-bold text-kaccent">{money(quote.totalEth)}</p>
              </div>

              <div className="flex flex-col items-center gap-3">
                <Link
                  to="/pagamento"
                  className="inline-flex h-10 w-full items-center justify-center rounded-[3px] bg-kprimary text-[15px] leading-4 font-bold text-kbg hover:opacity-90"
                >
                  Conectar e finalizar
                </Link>
                <Link
                  to="/"
                  hash="catalogo"
                  className="text-[15px] text-kaccent hover:opacity-90"
                >
                  Continuar explorando
                </Link>
              </div>
            </aside>
          </div>
        ) : null}

        {suggestions.length > 0 ? (
          <section className="mt-24">
            <div className="flex flex-col gap-3">
              <h2 className="text-[17px] leading-4 font-bold text-kaccent">
                Colecionadores também viram
              </h2>
              <div className="h-px bg-kprimary/30" />
            </div>
            <ul className="mt-8 grid grid-cols-5 gap-7">
              {suggestions.map((item) => (
                <li key={item.id}>
                  <NftCard nft={item} related />
                </li>
              ))}
            </ul>
            <div className="mt-8 flex justify-center gap-2" aria-hidden="true">
              <span className="size-3 rounded-full border-[1.3px] border-kprimary" />
              <span className="size-3 rounded-full bg-kprimary" />
              <span className="size-3 rounded-full border-[1.3px] border-kprimary" />
            </div>
          </section>
        ) : null}
      </main>
      <div className="hidden lg:block">
        <Footer />
      </div>
    </div>
  )
}

function StepButton({
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
      className="grid h-[30px] w-5 shrink-0 place-items-center rounded-[20px] border border-kbg bg-kprimary text-black shadow-[0_4px_12px_rgba(20,13,10,0.15)] hover:opacity-90 disabled:opacity-40"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
        {symbol === 'minus' ? (
          <path d="M1 4h7v1H1z" fill="currentColor" />
        ) : (
          <path d="M4 1h1v3h3v1H5v3H4V5H1V4h3z" fill="currentColor" />
        )}
      </svg>
    </button>
  )
}

function CartRow({
  item,
  pending,
  onQuantity,
  onRemove,
}: {
  item: CartItem
  pending: boolean
  onQuantity: (quantity: number) => void
  onRemove: () => void
}) {
  return (
    <li className="flex h-[70px] items-center justify-between bg-ksurface pr-6">
      <Link
        to="/nfts/$nftId"
        params={{ nftId: item.nftId }}
        className="flex w-[250px] min-w-0 items-center gap-4"
      >
        <img src={item.image} alt={item.name} className="size-[70px] shrink-0 rounded-md object-cover" />
        <span className="flex min-w-0 flex-col gap-1.5">
          <span className="truncate text-base leading-4 font-bold text-ktext">{item.name}</span>
          <span className="text-sm leading-4 text-kplaceholder">ID do token: {item.tokenId}</span>
        </span>
      </Link>
      <span className="w-[77px] text-base leading-4 font-bold text-kmuted">{money(item.priceEth)}</span>
      <div className="flex w-[75px] items-center justify-between">
        <StepButton
          label={`Diminuir ${item.name}`}
          symbol="minus"
          disabled={pending || item.quantity <= 1}
          onClick={() => onQuantity(item.quantity - 1)}
        />
        <span className="text-[17px] leading-6 text-ktext">{item.quantity}</span>
        <StepButton
          label={`Aumentar ${item.name}`}
          symbol="plus"
          disabled={pending || !item.available || item.quantity >= item.maxQuantity}
          onClick={() => onQuantity(item.quantity + 1)}
        />
      </div>
      <span className="w-[87px] text-right text-base leading-4 font-bold text-kaccent">
        {money(item.totalEth)}
      </span>
      <button
        type="button"
        className="grid size-6 place-items-center text-kplaceholder hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-kprimary disabled:opacity-40"
        aria-label={`Remover ${item.name}`}
        disabled={pending}
        onClick={onRemove}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 4.5V3.5h6v1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M4.5 6h15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <path
            d="M6.5 7.5l.8 12.2c.1 1 .9 1.8 1.9 1.8h5.6c1 0 1.8-.8 1.9-1.8L17.5 7.5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {!item.available ? (
        <p className="col-span-full text-xs text-ember">Edição indisponível</p>
      ) : null}
    </li>
  )
}
