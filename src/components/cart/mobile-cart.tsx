import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { Minus, Plus, Trash2 } from 'lucide-react'
import type { CartItem, CartQuote } from '../../types/cart'

const mono = { fontFamily: "'Roboto Mono', ui-monospace, monospace" } as const

// A resposta traz editionId ("1-50") e não um rótulo. A barra é só apresentação.
function editionLabel(editionId: string) {
  return editionId.replace('-', '/')
}

export function MobileCart({
  items,
  quote,
  loading,
  error,
  couponCode,
  couponMessage,
  actionMessage,
  itemsPending,
  couponPending,
  onRetry,
  onCouponCode,
  onApplyCoupon,
  onRemoveCoupon,
  onQuantity,
  onRemove,
}: {
  items: CartItem[]
  quote?: CartQuote
  loading: boolean
  error: boolean
  couponCode: string
  couponMessage: string
  actionMessage: string
  itemsPending: boolean
  couponPending: boolean
  onRetry: () => void
  onCouponCode: (value: string) => void
  onApplyCoupon: () => void
  onRemoveCoupon: () => void
  onQuantity: (item: CartItem, quantity: number) => void
  onRemove: (item: CartItem) => void
}) {
  const router = useRouter()
  const navigate = useNavigate()

  function goBack() {
    if (window.history.length > 1) {
      router.history.back()
      return
    }
    navigate({ to: '/' })
  }

  return (
    <div className="bg-black lg:hidden">
      <div
        className="mx-auto flex h-svh max-w-[414px] flex-col overflow-hidden rounded-[40px] bg-[#140D0A] pt-8 text-white"
        style={mono}
      >
        <header className="relative flex h-11 shrink-0 items-center px-7">
          <button type="button" className="shrink-0" aria-label="Voltar" onClick={goBack}>
            <svg
              width="35"
              height="35"
              viewBox="0 0 35 35"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M34.5 17.5C34.5 26.8888 26.8888 34.5 17.5 34.5C8.11116 34.5 0.5 26.8888 0.5 17.5C0.5 8.11116 8.11116 0.5 17.5 0.5C26.8888 0.5 34.5 8.11116 34.5 17.5Z"
                fill="#2F1D15"
                stroke="#3F2319"
              />
              <path
                d="M19.9166 22.8332C19.9166 22.8332 14.0833 19.3798 14.0833 16.9998C14.0833 14.6207 19.9166 11.1665 19.9166 11.1665"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                stroke="#B39463"
              />
            </svg>
          </button>
          <h1 className="pointer-events-none absolute inset-x-0 text-center text-base font-bold">
            Carrinho de NFTs
          </h1>
        </header>

        <div className="mt-1 min-h-0 flex-1 overflow-y-auto px-7 pt-3 pb-4">
          {loading ? (
            <div className="space-y-3">
              <div className="skeleton h-20 rounded-xl" />
              <div className="skeleton h-20 rounded-xl" />
            </div>
          ) : null}

          {error ? (
            <div role="alert">
              <p>Não foi possível carregar o carrinho.</p>
              <button
                type="button"
                className="mt-4 text-sm font-bold text-[#D9894A]"
                onClick={onRetry}
              >
                Tentar de novo
              </button>
            </div>
          ) : null}

          {!loading && !error && items.length === 0 ? (
            <div className="pt-8">
              <p>Seu carrinho está vazio</p>
              <button
                type="button"
                className="mt-4 h-11 rounded-full bg-[#D9894A] px-5 text-sm font-bold text-[#1A100C]"
                onClick={goBack}
              >
                Voltar
              </button>
            </div>
          ) : null}

          {actionMessage ? (
            <p className="mb-3 text-sm text-[#D9894A]" role="alert">
              {actionMessage}
            </p>
          ) : null}

          {items.length > 0 ? (
            <ul className="space-y-3" aria-label="Itens do carrinho">
              {items.map((item) => (
                <CartItemCard
                  key={`${item.nftId}-${item.editionId}`}
                  item={item}
                  pending={itemsPending}
                  onQuantity={onQuantity}
                  onRemove={onRemove}
                />
              ))}
            </ul>
          ) : null}
        </div>

        {quote && items.length > 0 ? (
          <section className="relative z-10 -mt-6 shrink-0 rounded-t-[32px] bg-[#241814] px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <form
              onSubmit={(event) => {
                event.preventDefault()
                onApplyCoupon()
              }}
            >
              <div className="flex items-center rounded-full border border-[#6b5346] bg-[#140D0A] pl-4">
                <label className="sr-only" htmlFor="mobile-coupon">
                  Código promocional
                </label>
                <input
                  id="mobile-coupon"
                  value={couponCode}
                  placeholder="Digite o código promocional..."
                  className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#C9A27A]"
                  onChange={(event) => onCouponCode(event.target.value)}
                />
                <button
                  type="submit"
                  className="m-1 h-11 rounded-full bg-gradient-to-r from-[#E3A15C] to-[#C47B3C] px-4 text-sm font-bold text-[#1A100C] disabled:opacity-50"
                  disabled={couponPending || couponCode.trim() === ''}
                >
                  Aplicar
                </button>
              </div>
              {couponMessage ? (
                <p className="mt-2 text-sm text-[#D9894A]" role="alert">
                  {couponMessage}
                </p>
              ) : null}
              {quote.coupon ? (
                <p className="mt-2 text-sm text-[#C9A27A]" role="status">
                  {quote.coupon}{' '}
                  <button
                    type="button"
                    className="font-bold text-[#D9894A]"
                    onClick={onRemoveCoupon}
                  >
                    Remover
                  </button>
                </p>
              ) : null}
            </form>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[#C9A27A]">Subtotal</dt>
                <dd>{quote.subtotalEth} ETH</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[#C9A27A]">Desconto do lançamento</dt>
                <dd className="text-[#C9A27A]">(-) {quote.discountEth}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-[#C9A27A]">Taxa de rede</dt>
                <dd className="text-right">
                  {quote.feeEth} ETH
                  <span className="mt-0.5 block text-[10px] text-[#D9894A]">Taxa estimada</span>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 font-bold">
                <dt>Total</dt>
                <dd className="text-[#D9894A]">{quote.totalEth} ETH</dd>
              </div>
            </dl>

            <Link
              to="/pagamento"
              className="mx-auto mt-4 flex h-[60px] w-[320px] shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#E3A15C] to-[#C47B3C] text-sm font-bold text-[#1A100C]"
            >
              Conectar e finalizar
            </Link>
          </section>
        ) : null}

        {loading ? (
          <section className="shrink-0 rounded-t-[32px] bg-[#241814] px-5 py-5">
            <div className="skeleton h-12 rounded-full" />
            <div className="mt-4 space-y-3">
              <div className="skeleton h-4 rounded" />
              <div className="skeleton h-4 rounded" />
              <div className="skeleton h-4 rounded" />
              <div className="skeleton h-4 rounded" />
            </div>
            <div className="skeleton mt-4 h-14 rounded-full" />
          </section>
        ) : null}
      </div>
    </div>
  )
}

function CartItemCard({
  item,
  pending,
  onQuantity,
  onRemove,
}: {
  item: CartItem
  pending: boolean
  onQuantity: (item: CartItem, quantity: number) => void
  onRemove: (item: CartItem) => void
}) {
  const atMinimum = item.quantity <= 1
  const atMaximum = !item.available || item.quantity >= item.maxQuantity

  return (
    <li className="flex overflow-hidden rounded-xl bg-[#241814]">
      <img src={item.image} alt={item.name} className="w-16 self-stretch object-cover" />
      <div className="min-w-0 flex-1 px-3 py-3">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight">{item.name}</p>
            <p className="mt-0.5 text-xs text-[#C9A27A]">Edição: {editionLabel(item.editionId)}</p>
          </div>
          <div className="flex shrink-0 items-center">
            {atMinimum ? (
              <button
                type="button"
                className="grid size-11 place-items-center text-[#C9A27A] disabled:opacity-40"
                aria-label={`Remover ${item.name}`}
                disabled={pending}
                onClick={() => onRemove(item)}
              >
                <Trash2 size={16} />
              </button>
            ) : (
              <button
                type="button"
                className="grid size-11 place-items-center disabled:opacity-40"
                aria-label={`Diminuir ${item.name}`}
                disabled={pending}
                onClick={() => onQuantity(item, item.quantity - 1)}
              >
                <span className="grid size-8 place-items-center rounded-full border border-[#C9A27A]">
                  <Minus size={14} />
                </span>
              </button>
            )}
            <span className="min-w-4 text-center text-sm" aria-live="polite">
              {item.quantity}
            </span>
            <button
              type="button"
              className="grid size-11 place-items-center disabled:opacity-40"
              aria-label={`Aumentar ${item.name}`}
              disabled={pending || atMaximum}
              onClick={() => onQuantity(item, item.quantity + 1)}
            >
              <span className="grid size-8 place-items-center rounded-full border border-[#C9A27A]">
                <Plus size={14} />
              </span>
            </button>
          </div>
        </div>
        {/* totalEth é o total da linha devolvido pela API; priceEth é o unitário. */}
        <p className="mt-1 text-base font-bold text-[#D9894A]">{item.totalEth} ETH</p>
        {!item.available ? <p className="mt-1 text-xs text-[#D9894A]">Edição indisponível</p> : null}
      </div>
    </li>
  )
}
