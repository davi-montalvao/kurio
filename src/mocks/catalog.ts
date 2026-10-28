import cosmic from '../assets/nfts/cosmic.png'
import emerald from '../assets/nfts/emerald.png'
import featured from '../assets/nfts/featured.png'
import goldenBeat from '../assets/nfts/golden-beat.png'
import goldenSignal from '../assets/nfts/golden-signal.png'
import ivory from '../assets/nfts/ivory.png'
import neon from '../assets/nfts/neon.png'
import sage from '../assets/nfts/sage.png'
import violet from '../assets/nfts/violet.png'
import { centsToEth, compareEth } from '../lib/eth'
import { readNftPatch } from './store'
import {
  collections,
  networks,
  type NftCollection,
  type NftListResponse,
  type NftSummary,
} from '../types/nft'

export const pageSize = 8

const portraits = [
  emerald,
  sage,
  neon,
  cosmic,
  violet,
  ivory,
  goldenBeat,
  goldenSignal,
]

const fillerNames = [
  'Atlas',
  'Nimbus',
  'Coral',
  'Órbita',
  'Lumen',
  'Bruma',
  'Vértice',
  'Pátina',
]

const quotas: Array<[NftCollection, number]> = [
  ['arte-digital', 33],
  ['fotografia', 12],
  ['musica', 65],
  ['arte-3d', 39],
  ['colecionaveis', 23],
  ['generativa', 17],
  ['jogos', 19],
  ['assinaturas', 13],
  ['utilidade', 18],
]

const named: NftSummary[] = [
  {
    id: 'emerald-ape-042',
    name: 'Emerald Ape #042',
    priceEth: '1.19',
    image: emerald,
    collection: 'arte-digital',
    network: 'ethereum',
    isNew: false,
    isTrending: false,
    featured: false,
  },
  {
    id: 'sage-nomad-009',
    name: 'Sage Nomad #009',
    priceEth: '1.69',
    image: sage,
    collection: 'arte-digital',
    network: 'ethereum',
    isNew: true,
    isTrending: false,
    featured: false,
  },
  {
    id: 'neon-vessel-552',
    name: 'Neon Vessel #552',
    priceEth: '1.99',
    compareAtPriceEth: '2.29',
    image: neon,
    collection: 'arte-digital',
    network: 'ethereum',
    isNew: false,
    isTrending: true,
    featured: false,
  },
  {
    id: 'cosmic-bloom-118',
    name: 'Cosmic Bloom #118',
    priceEth: '1.29',
    image: cosmic,
    featuredImage: featured,
    collection: 'arte-digital',
    network: 'ethereum',
    isNew: false,
    isTrending: false,
    featured: true,
  },
  {
    id: 'violet-nomad-314',
    name: 'Violet Nomad #314',
    priceEth: '1.39',
    image: violet,
    collection: 'arte-digital',
    network: 'polygon',
    isNew: true,
    isTrending: false,
    featured: false,
  },
  {
    id: 'ivory-baron-088',
    name: 'Ivory Baron #088',
    priceEth: '1.79',
    image: ivory,
    collection: 'arte-digital',
    network: 'ethereum',
    isNew: false,
    isTrending: true,
    featured: false,
  },
  {
    id: 'golden-beat-207',
    name: 'Golden Beat #207',
    priceEth: '0.99',
    image: goldenBeat,
    collection: 'arte-digital',
    network: 'solana',
    isNew: true,
    isTrending: false,
    featured: false,
  },
  {
    id: 'golden-signal-160',
    name: 'Golden Signal #160',
    priceEth: '0.39',
    image: goldenSignal,
    collection: 'arte-digital',
    network: 'ethereum',
    isNew: false,
    isTrending: true,
    featured: false,
  },
]

function buildCatalog() {
  const items = [...named]
  let serial = named.length

  for (const [collection, count] of quotas) {
    const already = items.filter((item) => item.collection === collection).length

    for (let index = already; index < count; index += 1) {
      serial += 1
      const cents = 20 + ((serial * 17) % 480)
      items.push({
        id: `${collection}-${serial}`,
        name: `${fillerNames[serial % fillerNames.length]} #${String(serial).padStart(3, '0')}`,
        priceEth: centsToEth(cents),
        image: portraits[serial % portraits.length] ?? emerald,
        collection,
        network: networks[serial % networks.length]?.id ?? 'ethereum',
        isNew: serial % 4 === 0,
        isTrending: serial % 5 === 0,
        featured: false,
      })
    }
  }

  return items
}

const catalog = buildCatalog()

const emeraldRelated = [
  'cosmic-bloom-118',
  'violet-nomad-314',
  'ivory-baron-088',
  'golden-beat-207',
  'golden-signal-160',
]

function present(nft: NftSummary) {
  const patch = readNftPatch(nft.id)
  if (!patch) return nft
  return { ...nft, priceEth: patch.priceEth }
}

export function findNft(id: string) {
  const nft = catalog.find((item) => item.id === id)
  return nft ? present(nft) : null
}

export function relatedNfts(id: string) {
  if (id === 'emerald-ape-042') {
    return emeraldRelated
      .map((itemId) => findNft(itemId))
      .filter((item) => item !== null)
  }

  const current = findNft(id)
  if (!current) return []

  return catalog
    .filter((item) => item.collection === current.collection && item.id !== id)
    .slice(0, 5)
}

export function queryCatalog(params: URLSearchParams): NftListResponse {
  const q = params.get('q')?.trim().toLowerCase() ?? ''
  const colecao = params.getAll('colecao')
  const rede = params.getAll('rede')
  const precoMin = params.get('precoMin')
  const precoMax = params.get('precoMax')
  const ordenar = params.get('ordenar')
  const aba = params.get('aba')
  const pagina = Math.max(1, Number(params.get('pagina')) || 1)

  const listed = catalog.map(present)
  let items = listed.filter((item) => {
    if (q && !item.name.toLowerCase().includes(q)) return false
    if (colecao.length > 0 && !colecao.includes(item.collection)) return false
    if (rede.length > 0 && !rede.includes(item.network)) return false
    if (precoMin && compareEth(item.priceEth, precoMin) < 0) return false
    if (precoMax && compareEth(item.priceEth, precoMax) > 0) return false
    if (aba === 'novos' && !item.isNew) return false
    if (aba === 'alta' && !item.isTrending) return false
    return true
  })

  if (ordenar === 'preco-asc') {
    items = [...items].sort(
      (a, b) => compareEth(a.priceEth, b.priceEth),
    )
  }

  if (ordenar === 'preco-desc') {
    items = [...items].sort(
      (a, b) => compareEth(b.priceEth, a.priceEth),
    )
  }

  const start = (pagina - 1) * pageSize
  const featuredSource = catalog.find((item) => item.featured) ?? null
  const featured = featuredSource ? present(featuredSource) : null
  const featuredVisible =
    featured && items.some((item) => item.id === featured.id) ? featured : null

  return {
    items: items.slice(start, start + pageSize),
    featured: featuredVisible,
    page: pagina,
    pageSize,
    total: items.length,
    facets: {
      collections: collections.map((collection) => ({
        id: collection.id,
        label: collection.label,
        count: catalog.filter((item) => item.collection === collection.id)
          .length,
      })),
      networks: networks.map((network) => ({
        id: network.id,
        label: network.label,
        count: catalog.filter((item) => item.network === network.id).length,
      })),
    },
  }
}
