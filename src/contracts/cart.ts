import { z } from 'zod'

const decimalEth = z.string().regex(/^\d+\.\d{2,3}$/)

export const nftSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  priceEth: decimalEth,
  compareAtPriceEth: decimalEth.optional(),
  image: z.string(),
  featuredImage: z.string().optional(),
  collection: z.enum([
    'arte-digital',
    'fotografia',
    'musica',
    'arte-3d',
    'colecionaveis',
    'generativa',
    'jogos',
    'assinaturas',
    'utilidade',
  ]),
  network: z.enum(['ethereum', 'polygon', 'solana']),
  isNew: z.boolean(),
  isTrending: z.boolean(),
  featured: z.boolean(),
})

export const cartItemSchema = z.object({
  nftId: z.string(),
  editionId: z.string(),
  name: z.string(),
  image: z.string(),
  tokenId: z.string(),
  priceEth: decimalEth,
  quantity: z.number().int().positive(),
  totalEth: decimalEth,
  maxQuantity: z.number().int().positive(),
  available: z.boolean(),
})

export const cartQuoteSchema = z.object({
  subtotalEth: decimalEth,
  discountEth: decimalEth,
  feeEth: decimalEth,
  totalEth: decimalEth,
  coupon: z.string().nullable(),
  version: z.number().int(),
})

export const cartResponseSchema = z.object({
  count: z.number().int().nonnegative(),
  items: z.array(cartItemSchema),
  suggestions: z.array(nftSummarySchema),
  quote: cartQuoteSchema,
})

export type CartResponse = z.infer<typeof cartResponseSchema>
