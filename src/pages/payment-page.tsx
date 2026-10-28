import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Footer } from '../components/footer'
import { FormField, SelectField } from '../components/form/form-field'
import { MobilePayment, type MobileCheckoutFields } from '../components/payment/mobile-payment'
import { OrderConfirmationModal } from '../components/order/order-confirmation-modal'
import { SiteHeader } from '../components/site-header'
import { ChevronDownIcon } from '../components/icons/AccountIcons'
import { Button } from '../components/ui/button'
import { api } from '../lib/api'
import { useRequireSession } from '../lib/require-session'
import { cartQueryOptions } from '../queries/cart'
import { useLive } from '../lib/realtime'
import type { CartItem, CartQuote, CartResponse } from '../types/cart'
import type { CheckoutInput, OrderResponse } from '../types/order'
import { networks } from '../types/nft'
import type { UserWallets } from '../types/wallet'

const fieldClass =
  'h-11 w-full rounded-lg border border-[#8a5a38] bg-transparent px-3 text-sm outline-none placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-ember'

const walletOptions = [
  { id: 'compativeis', label: 'METAMASK · WALLETCONNECT · COINBASE' },
  { id: 'metamask', label: 'MetaMask' },
  { id: 'coinbase', label: 'Coinbase Wallet' },
] as const

const walletTypes = ['MetaMask', 'WalletConnect', 'Coinbase Wallet']

function walletChoice(type: string) {
  if (type === 'MetaMask') return 'metamask'
  if (type === 'Coinbase Wallet') return 'coinbase'
  return 'compativeis'
}

function money(value: string) {
  return `${value} ETH`
}

export function PaymentPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const live = useLive()
  const attemptKey = useRef(sessionStorage.getItem('kurio-checkout-order') ?? crypto.randomUUID())
  const [orderId, setOrderId] = useState<string | null>(() => sessionStorage.getItem('kurio-checkout-order'))
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [couponOpen, setCouponOpen] = useState(false)
  const [code, setCode] = useState('')
  const [couponMessage, setCouponMessage] = useState('')
  const [wallet, setWallet] = useState('coinbase')
  const [walletReady, setWalletReady] = useState(false)
  const [useOther, setUseOther] = useState(false)
  const [link, setLink] = useState<'off' | 'on' | 'refused'>('off')
  const [account, setAccount] = useState<'primary' | 'secondary'>('primary')
  const cart = useQuery(cartQueryOptions())
  const session = useRequireSession()
  const wallets = useQuery({
    queryKey: ['wallets'],
    enabled: Boolean(session.data),
    queryFn: async ({ signal }) => {
      const response = await api.get<UserWallets>('/wallets', { signal })
      return response.data
    },
  })

  useEffect(() => {
    const type = wallets.data?.primary?.walletType
    if (!type || walletReady) return
    setWallet(walletChoice(type))
    setWalletReady(true)
  }, [wallets.data, walletReady])

  useEffect(() => {
    if (!wallets.data?.primary && wallets.data?.secondary) setAccount('secondary')
  }, [wallets.data])

  const placed = useQuery({
    queryKey: ['order', orderId],
    enabled: Boolean(orderId),
    retry: false,
    queryFn: async ({ signal }) => {
      const response = await api.get<OrderResponse>(`/orders/${orderId}`, { signal })
      return response.data
    },
  })

  const confirm = useMutation({
    mutationFn: async (input: CheckoutInput) => {
      const key = attemptKey.current
      sessionStorage.setItem('kurio-checkout-order', key)
      const response = await api.post<OrderResponse>('/orders', input, {
        headers: { 'Idempotency-Key': key },
      })
      return response.data
    },
    onSuccess: async (next) => {
      setError('')
      setFieldErrors({})
      setOrderId(next.id)
      queryClient.setQueryData(['order', next.id], next)
      await queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
    onError: (reason: { response?: { data?: { message?: string } } }) => {
      setError(reason.response?.data?.message ?? 'Não foi possível confirmar a compra')
    },
  })

  const applyCoupon = useMutation({
    mutationFn: async (nextCode: string) => {
      const response = await api.post<CartResponse>('/cart/coupon', { code: nextCode })
      return response.data
    },
    onSuccess: async () => {
      setCouponMessage('')
      setCode('')
      setCouponOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
    onError: (reason: { response?: { data?: { message?: string } } }) => {
      setCouponMessage(reason.response?.data?.message ?? 'Cupom inválido')
    },
  })

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (confirm.isPending) return
    const data = new FormData(event.currentTarget)
    const nextErrors: Record<string, string> = {}
    const required = [
      'displayName',
      'username',
      'network',
      'profileName',
      'walletAddress',
      'walletType',
      'referralCode',
      'email',
      'ensName',
    ]
    for (const name of required) {
      if (!String(data.get(name) ?? '').trim()) nextErrors[name] = 'Campo obrigatório.'
    }
    const email = String(data.get('email') ?? '')
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = 'Informe um e-mail válido.'
    }
    const address = String(data.get('walletAddress') ?? '')
    if (address && !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      nextErrors.walletAddress = 'Informe um endereço 0x com 42 caracteres.'
    }
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      setError('')
      return
    }
    setFieldErrors({})
    if (live.stale) {
      setError('O preço mudou. Revise o resumo antes de confirmar.')
      return
    }
    if (link !== 'on') {
      setError(link === 'refused' ? 'Conexão recusada' : 'Conecte a carteira antes de confirmar')
      return
    }
    confirm.mutate({
      displayName: String(data.get('displayName') ?? ''),
      username: String(data.get('username') ?? ''),
      network: String(data.get('network') ?? ''),
      profileName: String(data.get('profileName') ?? ''),
      walletAddress: String(data.get('walletAddress') ?? ''),
      secondaryWallet: String(data.get('secondaryWallet') ?? ''),
      walletType: String(data.get('walletType') ?? ''),
      referralCode: String(data.get('referralCode') ?? ''),
      email: String(data.get('email') ?? ''),
      ensName: String(data.get('ensName') ?? ''),
      ensSuffix: String(data.get('ensSuffix') ?? '.eth'),
      useAnotherWallet: data.get('useAnotherWallet') === 'on',
      note: String(data.get('note') ?? ''),
      wallet,
      quoteVersion: quote?.version ?? 0,
    })
  }

  const summary = cart.data
  const items = summary?.items ?? []
  const quote = summary?.quote
  const profileReady = !session.isPending && !wallets.isPending
  const primary = wallets.data?.primary ?? null
  const secondary = wallets.data?.secondary ?? null
  const secondaryAddress = secondary?.address || primary?.secondaryEns || ''
  const user = session.data ?? null
  const savedAccounts = [
    primary ? { id: 'primary' as const, wallet: primary } : null,
    secondary && !wallets.data?.sameAsPrimary ? { id: 'secondary' as const, wallet: secondary } : null,
  ].filter((item) => item !== null)
  const mobileLoading = cart.isPending || (items.length > 0 && !profileReady)

  function closeReceipt() {
    sessionStorage.removeItem('kurio-checkout-order')
    setOrderId(null)
    attemptKey.current = crypto.randomUUID()
    void navigate({ to: '/' })
  }

  const orderStatus = placed.data?.status
  const orderConfirmed =
    Boolean(placed.data) && orderStatus !== 'pending' && orderStatus !== 'refused'
  const orderPending = confirm.isPending || orderStatus === 'pending'

  function switchAccount() {
    if (!primary || !secondary || wallets.data?.sameAsPrimary) return
    setAccount((current) => (current === 'primary' ? 'secondary' : 'primary'))
  }

  function confirmMobile(fields?: MobileCheckoutFields) {
    if (confirm.isPending) return
    if (live.stale) {
      setError('O preço mudou. Revise o resumo antes de confirmar.')
      return
    }
    if (link !== 'on') {
      setError(link === 'refused' ? 'Conexão recusada' : 'Conecte a carteira antes de confirmar')
      return
    }
    if (fields) {
      confirm.mutate({
        ...fields,
        wallet,
        quoteVersion: quote?.version ?? 0,
      })
      return
    }
    const chosen = account === 'secondary' && secondary && !wallets.data?.sameAsPrimary ? secondary : primary
    confirm.mutate({
      displayName: chosen?.displayName || user?.displayName || '',
      username: user?.username ?? '',
      network: chosen?.network ?? '',
      profileName: chosen?.profileName ?? '',
      walletAddress: chosen?.address ?? '',
      secondaryWallet: account === 'secondary' ? (primary?.address ?? '') : secondaryAddress,
      walletType: chosen?.walletType ?? '',
      referralCode: chosen?.referralCode ?? '',
      email: chosen?.email || user?.email || '',
      ensName: chosen?.ensName || user?.ensName || '',
      ensSuffix: chosen?.ensSuffix || user?.ensSuffix || '.eth',
      useAnotherWallet: account === 'secondary',
      note: '',
      wallet,
      quoteVersion: quote?.version ?? 0,
    })
  }

  if (session.isPending) {
    return (
      <div className="min-h-svh bg-kbg">
        <div className="skeleton mx-auto mt-24 h-96 max-w-[1200px]" />
      </div>
    )
  }

  if (!session.data) {
    return (
      <div className="hidden min-h-svh bg-kbg md:block">
        <SiteHeader active="mercado" line={false} />
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-ink text-white">
      <MobilePayment
        loading={mobileLoading}
        error={cart.isError}
        empty={Boolean(summary && items.length === 0)}
        quote={quote}
        accounts={savedAccounts}
        profile={user}
        accountId={account}
        providerId={wallet}
        link={link}
        message={error}
        stale={live.stale}
        pending={orderPending}
        onRetry={() => cart.refetch()}
        onAccount={setAccount}
        onProvider={setWallet}
        onConnect={() => {
          setLink('on')
          setError('')
        }}
        onSwitch={switchAccount}
        onUseOther={() => {
          setLink('off')
          setError('')
        }}
        onConfirm={confirmMobile}
      />
      <div className="hidden min-h-svh bg-kbg font-mono text-ktext md:block">
      <SiteHeader active="mercado" line={false} />
      <main className="mx-auto mt-8 max-w-[1200px] px-6 pb-24 lg:px-0">
        <p className="text-[15px] leading-4 font-bold text-ktext">
          <Link to="/" className="hover:text-kaccent">Início</Link>
          <span> / </span>
          <Link to="/" hash="catalogo" className="hover:text-kaccent">Mercado</Link>
          <span> / Pagamento</span>
        </p>

        {cart.isPending || (items.length > 0 && !profileReady) ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="skeleton h-96 rounded-xl" />
            <div className="skeleton h-96 rounded-xl" />
          </div>
        ) : null}

        {cart.isError ? (
          <div className="mt-8" role="alert">
            <p>Não foi possível carregar o pagamento.</p>
            <button
              type="button"
              className="mt-4 text-sm font-semibold text-ember"
              onClick={() => cart.refetch()}
            >
              Tentar de novo
            </button>
          </div>
        ) : null}

        {summary && items.length === 0 ? (
          <div className="mt-10">
            <h1 className="text-2xl font-semibold">Seu carrinho está vazio</h1>
            <Link to="/carrinho" className="mt-4 inline-block text-ember">
              Voltar ao carrinho
            </Link>
          </div>
        ) : null}

        {summary && items.length > 0 && quote && profileReady ? (
          <form className="mt-8" noValidate onSubmit={onSubmit}>
            <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,763px)_405px]">
              <section className="flex flex-col gap-3">
                <h1 className="text-[17px] leading-4 font-bold text-ktext">Perfil do colecionador</h1>
                <div className="flex flex-col gap-6">
                <div
                  key={`${primary?.address ?? 'sem'}-${useOther ? 'outra' : 'salva'}`}
                  className="grid grid-cols-1 gap-6 md:grid-cols-2"
                >
                  <FormField
                    label="Nome de exibição"
                    name="displayName"
                    required
                    error={fieldErrors.displayName}
                    defaultValue={primary?.displayName || user?.displayName || ''}
                  />
                  <FormField
                    label="Nome de usuário"
                    name="username"
                    required
                    error={fieldErrors.username}
                    defaultValue={user?.username ?? ''}
                  />
                  <SelectField
                    label="Rede"
                    name="network"
                    required
                    placeholder="Selecione uma rede"
                    error={fieldErrors.network}
                    defaultValue={primary?.network ?? ''}
                    options={networks.map((item) => item.label)}
                  />
                  <FormField
                    label="Nome do perfil"
                    name="profileName"
                    required
                    error={fieldErrors.profileName}
                    defaultValue={primary?.profileName ?? ''}
                  />
                  <FormField
                    label="Endereço da carteira"
                    name="walletAddress"
                    required
                    placeholder="Endereço 0x da carteira"
                    error={fieldErrors.walletAddress}
                    defaultValue={useOther ? '' : (primary?.address ?? '')}
                  />
                  <FormField
                    label="ENS ou carteira secundária (opcional)"
                    name="secondaryWallet"
                    hideLabel
                    className="md:h-[69px]"
                    defaultValue={useOther ? '' : secondaryAddress}
                  />
                  <SelectField
                    label="Tipo de carteira"
                    name="walletType"
                    required
                    placeholder="Selecione uma carteira"
                    error={fieldErrors.walletType}
                    defaultValue={primary?.walletType ?? ''}
                    options={walletTypes}
                  />
                  <FormField
                    label="Código de indicação"
                    name="referralCode"
                    required
                    error={fieldErrors.referralCode}
                    defaultValue={primary?.referralCode ?? ''}
                  />
                  <FormField
                    label="E-mail"
                    name="email"
                    type="email"
                    required
                    error={fieldErrors.email}
                    defaultValue={primary?.email || user?.email || ''}
                  />
                  <EnsField
                    ensName={primary?.ensName || user?.ensName || ''}
                    ensSuffix={primary?.ensSuffix || user?.ensSuffix || '.eth'}
                    error={fieldErrors.ensName}
                  />
                </div>

                <label className="flex items-center gap-2 text-[15px] font-normal text-ktext">
                  <input
                    type="checkbox"
                    name="useAnotherWallet"
                    checked={useOther}
                    className="size-[15px] appearance-none rounded-full border-2 border-kprimary checked:bg-kprimary"
                    onChange={(event) => {
                      setUseOther(event.target.checked)
                      setLink('off')
                    }}
                  />
                  Usar outra carteira?
                </label>

                <label className="flex w-full max-w-[350px] flex-col gap-3 text-[15px] text-ktext">
                  Observação do colecionador (opcional)
                  <textarea
                    name="note"
                    className="h-[152px] w-full resize-none rounded-[3px] border border-kborder bg-transparent p-3 text-sm outline-none focus:border-kprimary"
                  />
                </label>
                </div>
              </section>

              <aside className="flex flex-col gap-3" aria-label="Revisão do pedido">
                <h2 className="text-[17px] leading-4 font-bold">Seus NFTs</h2>
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold">NFTs</span>
                  <span className="text-base font-medium">Subtotal</span>
                </div>
                <div className="h-px bg-kprimary/30" />
                <ul className="flex flex-col gap-3">
                  {items.map((item) => (
                    <OrderRow key={`${item.nftId}-${item.editionId}`} item={item} />
                  ))}
                </ul>

                <div className="text-center text-sm">
                  <button
                    type="button"
                    className="text-sm text-ktext"
                    onClick={() => setCouponOpen((open) => !open)}
                  >
                    Tem um código promocional?{' '}
                    <span className="text-kaccent">Aplique aqui</span>
                  </button>
                  {couponOpen ? (
                    <div className="mt-2 flex gap-2">
                      <input
                        value={code}
                        aria-label="Código promocional"
                        className={fieldClass}
                        onChange={(event) => setCode(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key !== 'Enter') return
                          event.preventDefault()
                          applyCoupon.mutate(code)
                        }}
                      />
                      <Button
                        type="button"
                        disabled={applyCoupon.isPending}
                        onClick={() => applyCoupon.mutate(code)}
                      >
                        Aplicar
                      </Button>
                    </div>
                  ) : null}
                  {couponMessage ? (
                    <p className="mt-2 text-ember" role="alert">
                      {couponMessage}
                    </p>
                  ) : null}
                </div>

                <Quote quote={quote} />

                <h2 className="mt-2 text-center text-[17px] leading-4 font-bold">Carteira e rede</h2>
                <fieldset className="flex flex-col gap-4">
                  <legend className="sr-only">Carteira e rede</legend>
                  {walletOptions.map((option) => (
                    <label
                      key={option.id}
                      className={
                        wallet === option.id
                          ? 'flex h-[45px] items-center gap-4 rounded-[3px] border border-kprimary px-4 text-[15px]'
                          : 'flex h-[45px] items-center gap-4 rounded-[3px] border border-kborder px-4 text-[15px]'
                      }
                    >
                      <input
                        type="radio"
                        name="wallet"
                        value={option.id}
                        checked={wallet === option.id}
                        required
                        className="size-4 appearance-none rounded-full border-[1.2px] border-kprimary checked:border-kprimary checked:bg-kprimary checked:shadow-[inset_0_0_0_3px_#241612]"
                        onChange={() => setWallet(option.id)}
                      />
                      {option.id === 'compativeis' ? (
                        <span className="inline-flex h-[26px] items-center rounded-md border border-kborder-2 bg-ksurface-2 px-2 text-[9px] font-bold tracking-[0.1px] text-kaccent">
                          METAMASK • WALLETCONNECT • COINBASE
                        </span>
                      ) : (
                        <span>{option.label}</span>
                      )}
                    </label>
                  ))}
                </fieldset>

                <p className="mt-3 text-sm text-sand" role="status">
                  {link === 'on'
                    ? 'Carteira conectada'
                    : link === 'refused'
                      ? 'Conexão recusada'
                      : 'Carteira desconectada'}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-[#8a5a38] px-3 py-1.5 text-sm"
                    onClick={() => {
                      setLink('on')
                      setError('')
                    }}
                  >
                    Conectar
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-[#8a5a38] px-3 py-1.5 text-sm"
                    onClick={() => setLink('refused')}
                  >
                    Recusar
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-[#8a5a38] px-3 py-1.5 text-sm disabled:opacity-50"
                    disabled={link !== 'on'}
                    onClick={() => setLink('off')}
                  >
                    Desconectar
                  </button>
                </div>

                {orderStatus === 'pending' ? (
                  <p className="text-sm text-kmuted" role="status">
                    Pedido pendente. Aguardando a confirmação da rede.
                  </p>
                ) : null}
                {orderStatus === 'refused' ? (
                  <p className="text-sm text-krequired" role="alert">
                    Pagamento recusado. Os itens continuam no carrinho.
                  </p>
                ) : null}
                {live.notice ? (
                  <p className="text-sm text-kaccent" role="status">
                    {live.notice}
                  </p>
                ) : null}
                {live.stale ? (
                  <p className="text-sm text-kaccent" role="status">
                    O preço mudou. Revise o resumo antes de confirmar.
                  </p>
                ) : null}

                {error ? (
                  <p className="text-sm text-krequired" role="alert">
                    {error}
                  </p>
                ) : null}

                <Button
                  type="submit"
                  className="mt-3 h-[45px] w-full rounded-lg bg-kprimary text-[15px] font-bold text-kbg hover:bg-kprimary"
                  disabled={orderPending || live.stale}
                >
                  Confirmar compra
                </Button>
              </aside>
            </div>
          </form>
        ) : null}
      </main>
      <Footer />
      </div>
      {orderConfirmed && placed.data ? (
        <OrderConfirmationModal order={placed.data} onClose={closeReceipt} />
      ) : null}
    </div>
  )
}

function OrderRow({ item }: { item: CartItem }) {
  return (
    <li className="flex h-[70px] items-center bg-ksurface pr-4 pl-1">
      <img src={item.image} alt="" className="size-[70px] rounded-lg object-cover" />
      <span className="ml-2 min-w-0 flex-1">
        <span className="block truncate text-base font-bold">{item.name}</span>
        <span className="mt-1.5 block text-sm text-kplaceholder">ID do token: {item.tokenId}</span>
      </span>
      <span className="text-sm text-kmuted">(x {item.quantity})</span>
      <span className="ml-3 text-lg font-bold text-kaccent">{money(item.totalEth)}</span>
    </li>
  )
}

function Quote({ quote }: { quote: CartQuote }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <dl className="flex w-full flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[15px] leading-4 font-normal">Subtotal</dt>
          <dd className="text-lg leading-4 font-normal">{money(quote.subtotalEth)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[15px] leading-4 font-normal">Desconto do lançamento</dt>
          <dd className="text-lg leading-4 font-normal">(-) {quote.discountEth}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[15px] leading-4 font-normal">Taxa de rede</dt>
          <dd className="text-lg leading-4 font-normal">{money(quote.feeEth)}</dd>
        </div>
      </dl>
      <p className="text-center text-xs text-kaccent">Taxa estimada</p>
      <div className="h-px w-full bg-kprimary/30" />
      <dl className="flex w-full items-center justify-between gap-4">
        <dt className="text-base font-bold">Total</dt>
        <dd className="text-lg font-bold text-kaccent">{money(quote.totalEth)}</dd>
      </dl>
    </div>
  )
}

function EnsField({
  ensName,
  ensSuffix,
  error,
}: {
  ensName: string
  ensSuffix: string
  error?: string
}) {
  const id = useId()
  const errorId = `${id}-error`
  return (
    <div className="flex min-w-0 flex-col">
      <label htmlFor={id} className="flex h-[29px] items-center gap-1 text-[15px] leading-[15px] text-ktext">
        Nome ENS
        <span className="text-[22px] leading-[29px] text-krequired">*</span>
      </label>
      <span className="flex gap-2.5">
        <span className="relative shrink-0">
          <select
            name="ensSuffix"
            defaultValue={ensSuffix}
            aria-label="Sufixo ENS"
            className="h-10 w-[104px] appearance-none rounded-[3px] border border-kborder bg-transparent pr-8 pl-3 text-[15px] text-ktext outline-none"
          >
            <option value=".eth">.eth</option>
          </select>
          <ChevronDownIcon
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-ktext"
          />
        </span>
        <input
          id={id}
          name="ensName"
          required
          defaultValue={ensName}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`h-10 min-w-0 flex-1 rounded-[3px] border bg-transparent px-3 text-sm text-ktext outline-none focus:border-kprimary ${error ? 'border-krequired' : 'border-kborder'}`}
        />
      </span>
      {error ? (
        <p id={errorId} className="mt-1 text-xs text-krequired">
          {error}
        </p>
      ) : null}
    </div>
  )
}
