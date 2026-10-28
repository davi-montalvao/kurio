export const collections = [
  { id: 'arte-digital', label: 'Arte digital' },
  { id: 'fotografia', label: 'Fotografia' },
  { id: 'musica', label: 'Música' },
  { id: 'arte-3d', label: 'Arte 3D' },
  { id: 'colecionaveis', label: 'Colecionáveis' },
  { id: 'generativa', label: 'Generativa' },
  { id: 'jogos', label: 'Jogos' },
  { id: 'assinaturas', label: 'Assinaturas' },
  { id: 'utilidade', label: 'Utilidade' },
] as const

export const networks = [
  { id: 'ethereum', label: 'Ethereum' },
  { id: 'polygon', label: 'Polygon' },
  { id: 'solana', label: 'Solana' },
] as const

export type NftCollection = (typeof collections)[number]['id']
export type NftNetwork = (typeof networks)[number]['id']

export type NftEdition = {
  id: string
  label: string
  available: boolean
  maxQuantity: number
}

export type NftDetail = NftSummary & {
  about: string
  paragraphs: string[]
  editions: NftEdition[]
  tokenId: string
  collectionName: string
  attributes: string[]
  reviewCount: number
  networkNote: string
  contractNote: string
  rightsNote: string
  favorite: boolean
  related: NftSummary[]
  gallery: string[]
}

export type NftSummary = {
  id: string
  name: string
  priceEth: string
  compareAtPriceEth?: string
  image: string
  featuredImage?: string
  collection: NftCollection
  network: NftNetwork
  isNew: boolean
  isTrending: boolean
  featured: boolean
}

export type CatalogFacet = {
  id: string
  label: string
  count: number
}

export type NftListResponse = {
  items: NftSummary[]
  featured: NftSummary | null
  page: number
  pageSize: number
  total: number
  facets: {
    collections: CatalogFacet[]
    networks: CatalogFacet[]
  }
}
