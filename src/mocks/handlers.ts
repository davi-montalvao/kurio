import { delay as wait } from 'msw'
import { readScenario } from './scenario'

function delay(ms: number) {
  const extra = readScenario() === 'lentidao' ? 2500 : 0
  return wait(ms + extra)
}
import { HttpResponse, http } from 'msw/http'
import { findNft, queryCatalog } from './catalog'
import { homeContent } from './fixtures/content'
import { getNftDetail } from './nft-detail'
import { buildCart, couponResult } from './quote'
import { finishOrder, socketHandlers } from './socket'
import {
  addCartLine,
  readCart,
  loginUser,
  logoutUser,
  findOrder,
  readOrder,
  readFavoriteIds,
  readQuoteVersion,
  readSession,
  readUserWallets,
  replaceOrder,
  saveCoupon,
  changePassword,
  saveAvatar,
  savePrimaryWallet,
  saveSecondaryWallet,
  setFavorite,
  signupUser,
  consumeSessionExpiry,
  updateCartLine,
  updateSessionUser,
} from './store'
import type { CheckoutInput, OrderResponse } from '../types/order'

function expiredSession() {
  if (!consumeSessionExpiry()) return null
  return HttpResponse.json(
    { message: 'Sua sessão expirou. Entre novamente.', code: 'session_expired' },
    { status: 401 },
  )
}
import type { CollectorWallet } from '../types/wallet'

const wallets = ['compativeis', 'metamask', 'coinbase']

const walletLabels: Record<string, string> = {
  compativeis: 'METAMASK · WALLETCONNECT · COINBASE',
  metamask: 'MetaMask',
  coinbase: 'Coinbase Wallet',
}

function transactionId() {
  const hex = [...crypto.getRandomValues(new Uint8Array(4))]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
  return `0x${hex.slice(0, 4)}...${hex.slice(4)}`
}

export const handlers = [
  ...socketHandlers,
  http.get('/api/content', async () => {
    await delay(200)
    return HttpResponse.json(homeContent)
  }),
  http.get('/api/nfts', async ({ request }) => {
    if (readScenario() === 'erro') {
      return HttpResponse.json({ message: 'Não foi possível carregar o catálogo.' }, { status: 500 })
    }
    if (readScenario() === 'vazio') {
      const url = new URL(request.url)
      const catalog = queryCatalog(url.searchParams)
      return HttpResponse.json({ ...catalog, items: [], featured: null, total: 0 })
    }
    await delay(400)
    const url = new URL(request.url)
    return HttpResponse.json(queryCatalog(url.searchParams))
  }),
  http.get('/api/nfts/:nftId', async ({ params }) => {
    await delay(250)
    const nft = getNftDetail(String(params.nftId))

    if (!nft) {
      return HttpResponse.json(
        { message: 'NFT não encontrado' },
        { status: 404 },
      )
    }

    return HttpResponse.json(nft)
  }),
  http.get('/api/favorites', () => {
    const expired = expiredSession()
    if (expired) return expired
    if (!readSession()) {
      return HttpResponse.json({ message: 'Entre para continuar' }, { status: 401 })
    }
    const items = readFavoriteIds()
      .map((id) => findNft(id))
      .filter((item) => item !== null)

    return HttpResponse.json({ items })
  }),
  http.post('/api/favorites/:nftId', async ({ params }) => {
    const expired = expiredSession()
    if (expired) return expired
    if (!readSession()) {
      return HttpResponse.json({ message: 'Entre para continuar' }, { status: 401 })
    }
    if (readScenario() === 'favorito') {
      await delay(600)
      return HttpResponse.json({ message: 'Não foi possível atualizar o favorito.' }, { status: 500 })
    }
    await delay(300)
    setFavorite(String(params.nftId), true)
    return HttpResponse.json({ favorite: true })
  }),
  http.delete('/api/favorites/:nftId', async ({ params }) => {
    const expired = expiredSession()
    if (expired) return expired
    if (!readSession()) {
      return HttpResponse.json({ message: 'Entre para continuar' }, { status: 401 })
    }
    await delay(300)
    setFavorite(String(params.nftId), false)
    return HttpResponse.json({ favorite: false })
  }),
  http.get('/api/cart', () => {
    const expired = expiredSession()
    if (expired) return expired
    return HttpResponse.json(buildCart())
  }),
  http.patch('/api/cart', async ({ request }) => {
    const expired = expiredSession()
    if (expired) return expired
    await delay(250)
    const body = (await request.json()) as {
      nftId?: string
      editionId?: string
      quantity?: number
    }
    const nft = getNftDetail(body.nftId ?? '')
    const edition = nft?.editions.find((item) => item.id === body.editionId)
    const quantity = body.quantity ?? 0
    const current = readCart().find(
      (item) => item.nftId === body.nftId && item.editionId === body.editionId,
    )

    if (!nft || !edition || !current || quantity < 1) {
      return HttpResponse.json({ message: 'Pedido inválido' }, { status: 422 })
    }

    if (!edition.available && quantity > current.quantity) {
      return HttpResponse.json(
        { message: 'Edição indisponível' },
        { status: 409 },
      )
    }

    if (quantity > edition.maxQuantity) {
      return HttpResponse.json(
        { message: 'Quantidade acima do limite da edição' },
        { status: 422 },
      )
    }

    updateCartLine(nft.id, edition.id, quantity)
    return HttpResponse.json(buildCart())
  }),
  http.delete('/api/cart', async ({ request }) => {
    const expired = expiredSession()
    if (expired) return expired
    await delay(200)
    const body = (await request.json()) as {
      nftId?: string
      editionId?: string
    }
    updateCartLine(body.nftId ?? '', body.editionId ?? '', 0)
    return HttpResponse.json(buildCart())
  }),
  http.post('/api/cart/coupon', async ({ request }) => {
    const expired = expiredSession()
    if (expired) return expired
    await delay(250)
    const body = (await request.json()) as { code?: string }
    const result = couponResult(body.code ?? '')

    if (!result.ok) {
      return HttpResponse.json({ message: result.message }, { status: 422 })
    }

    saveCoupon(result.code)
    return HttpResponse.json(buildCart())
  }),
  http.delete('/api/cart/coupon', async () => {
    const expired = expiredSession()
    if (expired) return expired
    await delay(200)
    saveCoupon(null)
    return HttpResponse.json(buildCart())
  }),
  http.post('/api/cart', async ({ request }) => {
    const expired = expiredSession()
    if (expired) return expired
    await delay(300)
    const body = (await request.json()) as {
      nftId?: string
      editionId?: string
      quantity?: number
    }
    const nft = getNftDetail(body.nftId ?? '')
    const edition = nft?.editions.find((item) => item.id === body.editionId)
    const quantity = body.quantity ?? 0

    if (!nft || !edition || quantity < 1) {
      return HttpResponse.json({ message: 'Pedido inválido' }, { status: 422 })
    }

    if (!edition.available) {
      return HttpResponse.json(
        { message: 'Edição indisponível' },
        { status: 409 },
      )
    }

    const result = addCartLine(
      { nftId: nft.id, editionId: edition.id, quantity },
      edition.maxQuantity,
    )

    if (!result.ok) {
      return HttpResponse.json({ message: result.message }, { status: 422 })
    }

    return HttpResponse.json({ count: result.count })
  }),
  http.get('/api/orders/:orderId', ({ params }) => {
    const expired = expiredSession()
    if (expired) return expired
    if (!readSession()) {
      return HttpResponse.json({ message: 'Entre para continuar' }, { status: 401 })
    }
    const order = readOrder(String(params.orderId))
    if (!order) {
      return HttpResponse.json({ message: 'Pedido não encontrado' }, { status: 404 })
    }
    return HttpResponse.json(order)
  }),
  http.post('/api/orders', async ({ request }) => {
    const expired = expiredSession()
    if (expired) return expired
    if (!readSession()) {
      return HttpResponse.json({ message: 'Entre para continuar' }, { status: 401 })
    }
    await delay(400)
    const key = request.headers.get('Idempotency-Key') ?? ''
    const existing = key ? findOrder(key) : null
    if (existing) {
      const owner = existing.userId ?? null
      const current = readSession()?.id ?? null
      if (owner !== current) {
        return HttpResponse.json({ message: 'Pedido já registrado' }, { status: 409 })
      }
      return HttpResponse.json(existing)
    }

    const body = (await request.json()) as Partial<CheckoutInput>
    const required = [
      body.displayName,
      body.username,
      body.network,
      body.profileName,
      body.walletAddress,
      body.walletType,
      body.referralCode,
      body.email,
      body.ensName,
      body.wallet,
    ]
    const wallet = body.wallet ?? ''

    if (required.some((value) => !value?.trim()) || !wallets.includes(wallet)) {
      return HttpResponse.json(
        { message: 'Preencha os campos obrigatórios' },
        { status: 422 },
      )
    }

    if (body.quoteVersion !== readQuoteVersion()) {
      return HttpResponse.json(
        { message: 'O preço mudou. Revise o resumo antes de confirmar.' },
        { status: 409 },
      )
    }

    const cart = buildCart()
    if (cart.items.length === 0) {
      return HttpResponse.json({ message: 'Carrinho vazio' }, { status: 422 })
    }

    const nextStatus = body.note?.trim().toLowerCase() === 'recusar' ? 'refused' : 'confirmed'
    const order: OrderResponse = {
      id: key || crypto.randomUUID(),
      txId: transactionId(),
      createdAt: new Date().toISOString(),
      network: body.network?.trim() ?? '',
      walletLabel: walletLabels[wallet] ?? wallet,
      items: cart.items,
      quote: cart.quote,
      status: 'pending',
      userId: readSession()?.id ?? null,
      nextStatus,
    }
    replaceOrder(order, false)
    setTimeout(() => finishOrder(order.id, nextStatus), 1200)
    if (readScenario() === 'timeout') {
      return HttpResponse.json(
        { message: 'A confirmação demorou demais. Tente de novo.' },
        { status: 504 },
      )
    }
    return HttpResponse.json(order)
  }),
  http.get('/api/session', () => {
    const expired = expiredSession()
    if (expired) return expired
    return HttpResponse.json({ user: readSession() })
  }),
  http.post('/api/session', async ({ request }) => {
    consumeSessionExpiry()
    await delay(300)
    const body = (await request.json()) as { email?: string; password?: string }
    const result = await loginUser(body.email ?? '', body.password ?? '')
    if (!result.ok) {
      return HttpResponse.json({ message: result.message }, { status: 422 })
    }
    return HttpResponse.json({ user: result.user })
  }),
  http.delete('/api/session', async () => {
    const expired = expiredSession()
    if (expired) return expired
    await delay(200)
    logoutUser()
    return HttpResponse.json({ user: null })
  }),
  http.post('/api/signup', async ({ request }) => {
    consumeSessionExpiry()
    await delay(300)
    const body = (await request.json()) as {
      username?: string
      email?: string
      password?: string
      confirmPassword?: string
    }
    if ((body.password ?? '') !== (body.confirmPassword ?? '')) {
      return HttpResponse.json({ message: 'As senhas não conferem' }, { status: 422 })
    }
    const result = await signupUser({
      username: body.username ?? '',
      email: body.email ?? '',
      password: body.password ?? '',
    })
    if (!result.ok) {
      return HttpResponse.json({ message: result.message }, { status: 422 })
    }
    return HttpResponse.json({ user: result.user })
  }),
  http.patch('/api/session', async ({ request }) => {
    const expired = expiredSession()
    if (expired) return expired
    await delay(300)
    const body = (await request.json()) as {
      displayName?: string
      username?: string
      email?: string
      ensName?: string
      ensSuffix?: string
      walletNickname?: string
      avatar?: string | null
      currentPassword?: string
      newPassword?: string
      confirmPassword?: string
    }
    if ((body.newPassword ?? '') !== (body.confirmPassword ?? '')) {
      return HttpResponse.json({ message: 'As senhas não conferem' }, { status: 422 })
    }
    const result = await updateSessionUser({
      displayName: body.displayName ?? '',
      username: body.username ?? '',
      email: body.email ?? '',
      ensName: body.ensName ?? '',
      ensSuffix: body.ensSuffix ?? '.eth',
      walletNickname: body.walletNickname ?? '',
      avatar: body.avatar ?? null,
      currentPassword: body.currentPassword ?? '',
      newPassword: body.newPassword ?? '',
    })
    if (!result.ok) {
      return HttpResponse.json(
        { message: result.message, fields: 'fields' in result ? result.fields : undefined },
        { status: result.status },
      )
    }
    return HttpResponse.json({ user: result.user })
  }),
  http.get('/api/profile', () => {
    const expired = expiredSession()
    if (expired) return expired
    return HttpResponse.json({ user: readSession() })
  }),
  http.patch('/api/profile', async ({ request }) => {
    const expired = expiredSession()
    if (expired) return expired
    await delay(300)
    const body = (await request.json()) as {
      displayName?: string
      username?: string
      email?: string
      ensName?: string
      ensSuffix?: string
      walletNickname?: string
      avatar?: string | null
    }
    const result = await updateSessionUser({
      displayName: body.displayName ?? '',
      username: body.username ?? '',
      email: body.email ?? '',
      ensName: body.ensName ?? '',
      ensSuffix: body.ensSuffix ?? '.eth',
      walletNickname: body.walletNickname ?? '',
      avatar: body.avatar ?? readSession()?.avatar ?? null,
      currentPassword: '',
      newPassword: '',
    })
    if (!result.ok) {
      return HttpResponse.json(
        { message: result.message, fields: 'fields' in result ? result.fields : undefined },
        { status: result.status },
      )
    }
    return HttpResponse.json({ user: result.user })
  }),
  http.post('/api/profile/avatar', async ({ request }) => {
    const expired = expiredSession()
    if (expired) return expired
    await delay(200)
    const body = (await request.json()) as { avatar?: string | null }
    const result = saveAvatar(body.avatar ?? null)
    if (!result.ok) {
      return HttpResponse.json(
        { message: result.message, fields: 'fields' in result ? result.fields : undefined },
        { status: result.status },
      )
    }
    return HttpResponse.json({ user: result.user })
  }),
  http.post('/api/profile/password', async ({ request }) => {
    const expired = expiredSession()
    if (expired) return expired
    await delay(300)
    const body = (await request.json()) as {
      currentPassword?: string
      newPassword?: string
      confirmPassword?: string
    }
    const result = await changePassword({
      currentPassword: body.currentPassword ?? '',
      newPassword: body.newPassword ?? '',
      confirmPassword: body.confirmPassword ?? '',
    })
    if (!result.ok) {
      return HttpResponse.json(
        { message: result.message, fields: result.fields },
        { status: result.status },
      )
    }
    return HttpResponse.json({ user: result.user })
  }),
  http.get('/api/wallets', () => {
    const expired = expiredSession()
    if (expired) return expired
    return HttpResponse.json(readUserWallets())
  }),
  http.post('/api/wallets', async ({ request }) => {
    const expired = expiredSession()
    if (expired) return expired
    await delay(300)
    const body = (await request.json()) as CollectorWallet
    const current = readUserWallets()
    const result = current.primary
      ? saveSecondaryWallet({ sameAsPrimary: false, wallet: body })
      : savePrimaryWallet(body)
    if (!result.ok) {
      return HttpResponse.json(
        { message: result.message, fields: 'fields' in result ? result.fields : undefined },
        { status: result.status },
      )
    }
    return HttpResponse.json(result.wallets)
  }),
  http.patch('/api/wallets/:id', async ({ params, request }) => {
    const expired = expiredSession()
    if (expired) return expired
    await delay(300)
    const id = String(params.id)
    const body = (await request.json()) as CollectorWallet
    if (id !== 'primary' && id !== 'secondary') {
      return HttpResponse.json({ message: 'Carteira não encontrada' }, { status: 404 })
    }
    const result =
      id === 'primary'
        ? savePrimaryWallet(body)
        : saveSecondaryWallet({ sameAsPrimary: false, wallet: body })
    if (!result.ok) {
      return HttpResponse.json(
        { message: result.message, fields: 'fields' in result ? result.fields : undefined },
        { status: result.status },
      )
    }
    return HttpResponse.json(result.wallets)
  }),
  http.put('/api/wallets/primary', async ({ request }) => {
    const expired = expiredSession()
    if (expired) return expired
    await delay(300)
    const body = (await request.json()) as CollectorWallet
    const result = savePrimaryWallet(body)
    if (!result.ok) {
      return HttpResponse.json(
        { message: result.message, fields: 'fields' in result ? result.fields : undefined },
        { status: result.status },
      )
    }
    return HttpResponse.json(result.wallets)
  }),
  http.put('/api/wallets/secondary', async ({ request }) => {
    const expired = expiredSession()
    if (expired) return expired
    await delay(300)
    const body = (await request.json()) as {
      sameAsPrimary?: boolean
      wallet?: CollectorWallet | null
    }
    const result = saveSecondaryWallet({
      sameAsPrimary: body.sameAsPrimary === true,
      wallet: body.wallet ?? null,
    })
    if (!result.ok) {
      return HttpResponse.json(
        { message: result.message, fields: 'fields' in result ? result.fields : undefined },
        { status: result.status },
      )
    }
    return HttpResponse.json(result.wallets)
  }),
]
