import type { SessionUser } from '../types/auth'
import type { OrderResponse } from '../types/order'
import type { CollectorWallet, UserWallets } from '../types/wallet'

export type CartLine = {
  nftId: string
  editionId: string
  quantity: number
}

export type StoredUser = SessionUser & {
  password: string
  wallets?: UserWallets
}

export type NftPatch = {
  version: number
  priceEth: string
  available: boolean
}

type Bag = {
  favorites: string[]
  cart: CartLine[]
  coupon: string | null
  orders: OrderResponse[]
}

type Memory = {
  bags: {
    guest: Bag
    users: Record<string, Bag>
  }
  users: StoredUser[]
  sessionId: string | null
  nftPatches: Record<string, NftPatch>
  quoteVersion: number
}

const storageKey = 'kurio-mock-store'

function emptyBag(): Bag {
  return { favorites: [], cart: [], coupon: null, orders: [] }
}

function emptyMemory(): Memory {
  return {
    bags: { guest: emptyBag(), users: {} },
    users: [],
    sessionId: null,
    nftPatches: {},
    quoteVersion: 1,
  }
}

function asBag(value: unknown): Bag {
  if (!value || typeof value !== 'object') return emptyBag()
  const bag = value as Partial<Bag>
  return {
    favorites: Array.isArray(bag.favorites)
      ? bag.favorites.filter((item) => typeof item === 'string')
      : [],
    cart: Array.isArray(bag.cart) ? bag.cart : [],
    coupon: typeof bag.coupon === 'string' ? bag.coupon : null,
    orders: Array.isArray(bag.orders) ? bag.orders : [],
  }
}

function readMemory(): Memory {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return emptyMemory()
    const parsed = JSON.parse(raw) as Partial<Memory> & Partial<Bag>
    const sessionId = typeof parsed.sessionId === 'string' ? parsed.sessionId : null
    const legacy = asBag(parsed)
    const storedBags = parsed.bags
    const bags = storedBags
      ? {
          guest: asBag(storedBags.guest),
          users: Object.fromEntries(
            Object.entries(storedBags.users ?? {}).map(([id, bag]) => [id, asBag(bag)]),
          ),
        }
      : sessionId
        ? { guest: emptyBag(), users: { [sessionId]: legacy } }
        : { guest: legacy, users: {} }

    return {
      bags,
      users: Array.isArray(parsed.users) ? parsed.users : [],
      sessionId,
      nftPatches:
        parsed.nftPatches && typeof parsed.nftPatches === 'object' ? parsed.nftPatches : {},
      quoteVersion: typeof parsed.quoteVersion === 'number' ? parsed.quoteVersion : 1,
    }
  } catch {
    return emptyMemory()
  }
}

function writeMemory(memory: Memory) {
  localStorage.setItem(storageKey, JSON.stringify(memory))
}

function activeKey(memory: Memory) {
  return memory.sessionId ?? 'guest'
}

function bagByKey(memory: Memory, key: string) {
  if (key === 'guest') return memory.bags.guest
  return memory.bags.users[key] ?? emptyBag()
}

function putBag(memory: Memory, key: string, bag: Bag): Memory {
  if (key === 'guest') {
    return { ...memory, bags: { ...memory.bags, guest: bag } }
  }
  return {
    ...memory,
    bags: { ...memory.bags, users: { ...memory.bags.users, [key]: bag } },
  }
}

function readActiveBag(memory: Memory) {
  return bagByKey(memory, activeKey(memory))
}

function writeActiveBag(memory: Memory, bag: Bag) {
  return putBag(memory, activeKey(memory), bag)
}

function bagKeyForOrder(memory: Memory, orderId: string) {
  if (memory.bags.guest.orders.some((order) => order.id === orderId)) return 'guest'
  for (const [userId, bag] of Object.entries(memory.bags.users)) {
    if (bag.orders.some((order) => order.id === orderId)) return userId
  }
  return null
}

function mergeGuestIntoUser(memory: Memory, userId: string): Memory {
  const guest = memory.bags.guest
  const userBag = memory.bags.users[userId] ?? emptyBag()
  const cart = userBag.cart.map((line) => ({ ...line }))

  for (const line of guest.cart) {
    const found = cart.find(
      (item) => item.nftId === line.nftId && item.editionId === line.editionId,
    )
    if (found) found.quantity += line.quantity
    else cart.push({ ...line })
  }

  return {
    ...memory,
    sessionId: userId,
    bags: {
      guest: emptyBag(),
      users: {
        ...memory.bags.users,
        [userId]: {
          favorites: [...new Set([...userBag.favorites, ...guest.favorites])],
          cart,
          coupon: userBag.coupon ?? guest.coupon,
          orders: [
            ...userBag.orders,
            ...guest.orders
              .filter((order) => !userBag.orders.some((item) => item.id === order.id))
              .map((order) => ({ ...order, userId })),
          ],
        },
      },
    },
  }
}

export function readFavoriteIds() {
  return readActiveBag(readMemory()).favorites
}

export function isFavorite(nftId: string) {
  return readFavoriteIds().includes(nftId)
}

export function setFavorite(nftId: string, favorite: boolean) {
  const memory = readMemory()
  const bag = readActiveBag(memory)
  const favorites = favorite
    ? [...new Set([...bag.favorites, nftId])]
    : bag.favorites.filter((item) => item !== nftId)

  writeMemory(writeActiveBag(memory, { ...bag, favorites }))
}

export function readCart() {
  return readActiveBag(readMemory()).cart
}

export function cartCount() {
  return readCart().reduce((total, line) => total + line.quantity, 0)
}

export function readCoupon() {
  return readActiveBag(readMemory()).coupon
}

export function saveCoupon(code: string | null) {
  const memory = readMemory()
  const bag = readActiveBag(memory)
  writeMemory(writeActiveBag(memory, { ...bag, coupon: code }))
}

export function readOrder(id: string) {
  return readActiveBag(readMemory()).orders.find((order) => order.id === id) ?? null
}

export function findOrder(id: string) {
  const memory = readMemory()
  const key = bagKeyForOrder(memory, id)
  if (!key) return null
  return bagByKey(memory, key).orders.find((order) => order.id === id) ?? null
}

export function listPendingOrders() {
  const memory = readMemory()
  return [memory.bags.guest, ...Object.values(memory.bags.users)].flatMap((bag) =>
    bag.orders.filter((order) => order.status === 'pending'),
  )
}

export function replaceOrder(order: OrderResponse, consume: boolean) {
  const memory = readMemory()
  const key = bagKeyForOrder(memory, order.id) ?? activeKey(memory)
  const bag = bagByKey(memory, key)
  const orders = bag.orders.some((item) => item.id === order.id)
    ? bag.orders.map((item) => (item.id === order.id ? order : item))
    : [...bag.orders, order]
  const cart = consume ? consumeLines(bag.cart, order.items) : bag.cart
  writeMemory(
    putBag(memory, key, {
      ...bag,
      orders,
      cart,
      coupon: consume && cart.length === 0 ? null : bag.coupon,
    }),
  )
}

function consumeLines(cart: CartLine[], items: OrderResponse['items']) {
  return cart.flatMap((line) => {
    const bought = items.find(
      (item) => item.nftId === line.nftId && item.editionId === line.editionId,
    )
    if (!bought) return [line]
    const quantity = line.quantity - bought.quantity
    return quantity > 0 ? [{ ...line, quantity }] : []
  })
}

export function readNftPatch(nftId: string) {
  return readMemory().nftPatches[nftId] ?? null
}

export function readQuoteVersion() {
  return readMemory().quoteVersion
}

export function saveNftUpdate(nftId: string, priceEth: string, available: boolean) {
  const memory = readMemory()
  const version = memory.quoteVersion + 1
  writeMemory({
    ...memory,
    quoteVersion: version,
    nftPatches: {
      ...memory.nftPatches,
      [nftId]: { version, priceEth, available },
    },
  })
  return version
}

export function saveOrder(order: OrderResponse) {
  const memory = readMemory()
  const bag = readActiveBag(memory)
  if (bag.orders.some((item) => item.id === order.id)) return
  writeMemory(writeActiveBag(memory, { ...bag, orders: [...bag.orders, order] }))
}

export function clearCart() {
  const memory = readMemory()
  const bag = readActiveBag(memory)
  writeMemory(writeActiveBag(memory, { ...bag, cart: [], coupon: null }))
}

export function updateCartLine(
  nftId: string,
  editionId: string,
  quantity: number,
) {
  const memory = readMemory()
  const bag = readActiveBag(memory)
  const exists = bag.cart.some(
    (item) => item.nftId === nftId && item.editionId === editionId,
  )

  if (!exists) return false

  const cart =
    quantity < 1
      ? bag.cart.filter((item) => item.nftId !== nftId || item.editionId !== editionId)
      : bag.cart.map((item) =>
          item.nftId === nftId && item.editionId === editionId
            ? { ...item, quantity }
            : item,
        )

  writeMemory(writeActiveBag(memory, { ...bag, cart }))
  return true
}

export function addCartLine(line: CartLine, maxQuantity: number) {
  const memory = readMemory()
  const bag = readActiveBag(memory)
  const current = bag.cart.find(
    (item) => item.nftId === line.nftId && item.editionId === line.editionId,
  )
  const nextQuantity = (current?.quantity ?? 0) + line.quantity

  if (nextQuantity > maxQuantity) {
    return { ok: false as const, message: 'Quantidade acima do limite da edição' }
  }

  const cart = current
    ? bag.cart.map((item) =>
        item.nftId === line.nftId && item.editionId === line.editionId
          ? { ...item, quantity: nextQuantity }
          : item,
      )
    : [...bag.cart, line]

  writeMemory(writeActiveBag(memory, { ...bag, cart }))
  return { ok: true as const, count: cart.reduce((total, item) => total + item.quantity, 0) }
}

function toPublicUser(user: StoredUser): SessionUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    ensName: user.ensName,
    ensSuffix: user.ensSuffix,
    walletNickname: user.walletNickname,
    avatar: user.avatar,
  }
}

export function readSession() {
  const memory = readMemory()
  const user = memory.users.find((item) => item.id === memory.sessionId)
  return user ? toPublicUser(user) : null
}

async function hashPassword(password: string) {
  const bytes = new TextEncoder().encode(password)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function passwordMatches(stored: string, input: string) {
  const hash = await hashPassword(input)
  return { ok: stored === hash || stored === input, hash }
}

export async function signupUser(input: {
  username: string
  email: string
  password: string
}) {
  const memory = readMemory()
  const email = input.email.trim().toLowerCase()
  const username = input.username.trim()

  if (!username || !email || !input.password) {
    return { ok: false as const, message: 'Preencha os campos obrigatórios' }
  }

  if (memory.users.some((user) => user.email === email)) {
    return { ok: false as const, message: 'E-mail já cadastrado' }
  }

  const user: StoredUser = {
    id: crypto.randomUUID(),
    email,
    username,
    password: await hashPassword(input.password),
    displayName: '',
    ensName: '',
    ensSuffix: '.eth',
    walletNickname: '',
    avatar: null,
  }

  writeMemory(mergeGuestIntoUser({ ...memory, users: [...memory.users, user] }, user.id))
  return { ok: true as const, user: toPublicUser(user) }
}

export async function loginUser(email: string, password: string) {
  const memory = readMemory()
  const found = memory.users.find((item) => item.email === email.trim().toLowerCase())
  const match = found ? await passwordMatches(found.password, password) : null

  if (!found || !match?.ok) {
    return { ok: false as const, message: 'E-mail ou senha inválidos' }
  }

  const users =
    found.password === match.hash
      ? memory.users
      : memory.users.map((item) =>
          item.id === found.id ? { ...item, password: match.hash } : item,
        )

  writeMemory(mergeGuestIntoUser({ ...memory, users }, found.id))
  return { ok: true as const, user: toPublicUser(found) }
}

export function logoutUser() {
  const memory = readMemory()
  writeMemory({ ...memory, sessionId: null })
}

const expireKey = 'kurio-expire-session'

export function consumeSessionExpiry() {
  if (sessionStorage.getItem(expireKey) !== '1') return false
  sessionStorage.removeItem(expireKey)
  const memory = readMemory()
  if (!memory.sessionId) return false
  writeMemory({ ...memory, sessionId: null })
  return true
}

export async function updateSessionUser(input: {
  displayName: string
  username: string
  email: string
  ensName: string
  ensSuffix: string
  walletNickname: string
  avatar: string | null
  currentPassword: string
  newPassword: string
}) {
  const memory = readMemory()
  const current = memory.users.find((item) => item.id === memory.sessionId)

  if (!current) {
    return { ok: false as const, status: 401, message: 'Entre para salvar' }
  }

  const fields: Record<string, string> = {}
  if (!input.displayName.trim()) fields.displayName = 'Campo obrigatório.'
  if (!input.username.trim()) fields.username = 'Campo obrigatório.'
  if (!input.email.trim()) fields.email = 'Campo obrigatório.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    fields.email = 'Informe um e-mail válido.'
  }
  if (!input.walletNickname.trim()) fields.walletNickname = 'Campo obrigatório.'
  if (Object.keys(fields).length > 0) {
    return { ok: false as const, status: 422, message: 'Preencha os campos obrigatórios', fields }
  }

  const email = input.email.trim().toLowerCase()
  const taken = memory.users.some((user) => user.id !== current.id && user.email === email)
  if (taken) {
    return {
      ok: false as const,
      status: 422,
      message: 'E-mail já cadastrado',
      fields: { email: 'E-mail já cadastrado' },
    }
  }

  let password = current.password
  if (input.currentPassword || input.newPassword) {
    const passwordFields: Record<string, string> = {}
    const match = await passwordMatches(current.password, input.currentPassword)
    if (!match.ok) {
      passwordFields.currentPassword = 'Senha atual inválida'
    }
    if (input.newPassword.length < 8) {
      passwordFields.newPassword = 'A nova senha precisa ter pelo menos 8 caracteres.'
    }
    if (Object.keys(passwordFields).length > 0) {
      return {
        ok: false as const,
        status: 422,
        message: Object.values(passwordFields)[0] ?? 'Não foi possível salvar',
        fields: passwordFields,
      }
    }
    password = await hashPassword(input.newPassword)
  }

  const next: StoredUser = {
    ...current,
    displayName: input.displayName.trim(),
    username: input.username.trim(),
    email,
    ensName: input.ensName.trim(),
    ensSuffix: input.ensSuffix || '.eth',
    walletNickname: input.walletNickname.trim(),
    avatar: input.avatar,
    password,
  }

  writeMemory({
    ...memory,
    users: memory.users.map((user) => (user.id === current.id ? next : user)),
  })
  return { ok: true as const, user: toPublicUser(next) }
}

const emptyWallets: UserWallets = {
  primary: null,
  secondary: null,
  sameAsPrimary: false,
}

export function readUserWallets(): UserWallets {
  const memory = readMemory()
  const user = memory.users.find((item) => item.id === memory.sessionId)
  return user?.wallets ?? emptyWallets
}

export function savePrimaryWallet(input: CollectorWallet) {
  const memory = readMemory()
  const current = memory.users.find((item) => item.id === memory.sessionId)
  if (!current) {
    return { ok: false as const, status: 401, message: 'Entre para salvar' }
  }
  const problems = walletProblems(input)
  if (Object.keys(problems).length > 0) {
    return {
      ok: false as const,
      status: 422,
      message: Object.values(problems)[0] ?? 'Preencha os campos obrigatórios',
      fields: problems,
    }
  }

  const wallets = current.wallets ?? emptyWallets
  const primary = cleanWallet(input)
  const next: StoredUser = {
    ...current,
    wallets: {
      ...wallets,
      primary,
      secondary: wallets.sameAsPrimary ? primary : wallets.secondary,
    },
  }
  writeMemory({
    ...memory,
    users: memory.users.map((user) => (user.id === current.id ? next : user)),
  })
  return { ok: true as const, wallets: next.wallets ?? emptyWallets }
}

export function saveSecondaryWallet(input: {
  sameAsPrimary: boolean
  wallet: CollectorWallet | null
}) {
  const memory = readMemory()
  const current = memory.users.find((item) => item.id === memory.sessionId)
  if (!current) {
    return { ok: false as const, status: 401, message: 'Entre para salvar' }
  }

  const wallets = current.wallets ?? emptyWallets
  if (input.sameAsPrimary) {
    if (!wallets.primary) {
      return { ok: false as const, status: 422, message: 'Salve a carteira principal antes' }
    }
    const nextWallets: UserWallets = {
      ...wallets,
      sameAsPrimary: true,
      secondary: wallets.primary,
    }
    return writeWallets(memory, current, nextWallets)
  }

  if (!input.wallet) {
    return writeWallets(memory, current, {
      ...wallets,
      sameAsPrimary: false,
      secondary: null,
    })
  }

  const problems = walletProblems(input.wallet)
  if (Object.keys(problems).length > 0) {
    return {
      ok: false as const,
      status: 422,
      message: Object.values(problems)[0] ?? 'Preencha os campos obrigatórios',
      fields: problems,
    }
  }

  return writeWallets(memory, current, {
    ...wallets,
    sameAsPrimary: false,
    secondary: cleanWallet(input.wallet),
  })
}

function writeWallets(memory: Memory, current: StoredUser, wallets: UserWallets) {
  const next: StoredUser = { ...current, wallets }
  writeMemory({
    ...memory,
    users: memory.users.map((user) => (user.id === current.id ? next : user)),
  })
  return { ok: true as const, wallets }
}

function walletProblems(wallet: CollectorWallet) {
  const fields: Record<string, string> = {}
  const required: Array<[keyof CollectorWallet, string]> = [
    ['displayName', 'displayName'],
    ['walletNickname', 'walletNickname'],
    ['network', 'network'],
    ['profileName', 'profileName'],
    ['address', 'address'],
    ['walletType', 'walletType'],
    ['referralCode', 'referralCode'],
    ['email', 'email'],
    ['ensName', 'ensName'],
  ]
  for (const [key] of required) {
    if (!String(wallet[key] ?? '').trim()) fields[key] = 'Campo obrigatório.'
  }
  if (wallet.address?.trim() && !/^0x[a-fA-F0-9]{40}$/.test(wallet.address.trim())) {
    fields.address = 'Informe um endereço 0x com 42 caracteres.'
  }
  if (wallet.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(wallet.email.trim())) {
    fields.email = 'Informe um e-mail válido.'
  }
  return fields
}

export function saveAvatar(avatar: string | null) {
  const memory = readMemory()
  const current = memory.users.find((item) => item.id === memory.sessionId)
  if (!current) {
    return { ok: false as const, status: 401, message: 'Entre para salvar' }
  }
  if (avatar && !avatar.startsWith('data:image/')) {
    return {
      ok: false as const,
      status: 422,
      message: 'Envie uma imagem',
      fields: { avatar: 'Envie uma imagem.' },
    }
  }
  if (avatar && avatar.length > 2_800_000) {
    return {
      ok: false as const,
      status: 422,
      message: 'A imagem é grande demais',
      fields: { avatar: 'A imagem passa de 2 MB.' },
    }
  }
  const next: StoredUser = { ...current, avatar }
  writeMemory({
    ...memory,
    users: memory.users.map((user) => (user.id === current.id ? next : user)),
  })
  return { ok: true as const, user: toPublicUser(next) }
}

export async function changePassword(input: {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}) {
  const memory = readMemory()
  const current = memory.users.find((item) => item.id === memory.sessionId)
  if (!current) {
    return { ok: false as const, status: 401, message: 'Entre para salvar' }
  }
  const fields: Record<string, string> = {}
  const match = await passwordMatches(current.password, input.currentPassword)
  if (!match.ok) fields.currentPassword = 'Senha atual inválida'
  if (input.newPassword.length < 8) {
    fields.newPassword = 'A nova senha precisa ter pelo menos 8 caracteres.'
  }
  if (input.newPassword !== input.confirmPassword) {
    fields.confirmPassword = 'As senhas não conferem'
  }
  if (Object.keys(fields).length > 0) {
    return {
      ok: false as const,
      status: 422,
      message: Object.values(fields)[0] ?? 'Não foi possível salvar',
      fields,
    }
  }
  const next: StoredUser = { ...current, password: await hashPassword(input.newPassword) }
  writeMemory({
    ...memory,
    users: memory.users.map((user) => (user.id === current.id ? next : user)),
  })
  return { ok: true as const, user: toPublicUser(next) }
}

function cleanWallet(wallet: CollectorWallet): CollectorWallet {
  return {
    displayName: wallet.displayName.trim(),
    walletNickname: wallet.walletNickname.trim(),
    network: wallet.network.trim(),
    profileName: wallet.profileName.trim(),
    address: wallet.address.trim(),
    secondaryEns: wallet.secondaryEns.trim(),
    walletType: wallet.walletType.trim(),
    referralCode: wallet.referralCode.trim(),
    email: wallet.email.trim(),
    ensName: wallet.ensName.trim(),
    ensSuffix: wallet.ensSuffix || '.eth',
  }
}
