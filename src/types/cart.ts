import type { NftSummary } from './nft'

export type CartItem = {
  nftId: string
  editionId: string
  name: string
  image: string
  tokenId: string
  /** Preço unitário, já formatado pela API. */
  priceEth: string
  quantity: number
  /** Total da linha, já formatado pela API. */
  totalEth: string
  maxQuantity: number
  available: boolean
}

export type CartQuote = {
  subtotalEth: string
  discountEth: string
  feeEth: string
  totalEth: string
  coupon: string | null
  version: number
}

export type CartResponse = {
  count: number
  items: CartItem[]
  suggestions: NftSummary[]
  quote: CartQuote
}

export type CartErrorBody = {
  message: string
}
