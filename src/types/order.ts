import type { CartItem, CartQuote } from './cart'

export type CheckoutInput = {
  displayName: string
  username: string
  network: string
  profileName: string
  walletAddress: string
  secondaryWallet: string
  walletType: string
  referralCode: string
  email: string
  ensName: string
  ensSuffix: string
  useAnotherWallet: boolean
  note: string
  wallet: string
  quoteVersion: number
}

export type OrderStatus = 'pending' | 'confirmed' | 'refused'

export type OrderResponse = {
  id: string
  txId: string
  createdAt: string
  network: string
  walletLabel: string
  items: CartItem[]
  quote: CartQuote
  status?: OrderStatus
  userId?: string | null
  nextStatus?: 'confirmed' | 'refused'
}
