import { lineTotalEth, quoteFromLines } from '../lib/eth'
import { relatedNfts } from './catalog'
import { getNftDetail } from './nft-detail'
import { cartCount, readCart, readCoupon, readQuoteVersion } from './store'
import type { CartItem, CartResponse } from '../types/cart'

const networkFeeEth = '0.016'

export function buildCart(): CartResponse {
  const items = readCart().flatMap((line) => {
    const nft = getNftDetail(line.nftId)
    const edition = nft?.editions.find((item) => item.id === line.editionId)
    if (!nft || !edition) return []

    const item: CartItem = {
      nftId: nft.id,
      editionId: edition.id,
      name: nft.name,
      image: nft.image,
      tokenId: nft.tokenId,
      priceEth: nft.priceEth,
      quantity: line.quantity,
      totalEth: lineTotalEth(nft.priceEth, line.quantity),
      maxQuantity: edition.maxQuantity,
      available: edition.available,
    }
    return [item]
  })

  const coupon = readCoupon()

  return {
    count: cartCount(),
    items,
    suggestions: relatedNfts('emerald-ape-042'),
    quote: {
      ...quoteFromLines(
        items.map((item) => item.totalEth),
        Boolean(coupon),
        networkFeeEth,
      ),
      coupon,
      version: readQuoteVersion(),
    },
  }
}

export function couponResult(code: string) {
  const normalized = code.trim().toUpperCase()

  if (!normalized) {
    return { ok: false as const, message: 'Informe um cupom' }
  }

  if (normalized === 'EXPIRADO') {
    return { ok: false as const, message: 'Cupom expirado' }
  }

  if (normalized !== 'KURIO10') {
    return { ok: false as const, message: 'Cupom inválido' }
  }

  return { ok: true as const, code: normalized }
}
