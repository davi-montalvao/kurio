import emeraldAlt from '../assets/nfts/emerald-alt.png'
import emeraldClose from '../assets/nfts/emerald-close.png'
import { findNft, relatedNfts } from './catalog'
import { readScenario } from './scenario'
import { isFavorite, readNftPatch } from './store'
import { collections, networks, type NftDetail, type NftSummary } from '../types/nft'

function labelOf<T extends { id: string; label: string }>(list: readonly T[], id: string) {
  return list.find((item) => item.id === id)?.label ?? id
}

function tokenId(nft: NftSummary) {
  if (nft.id === 'emerald-ape-042') return '#0042'
  const match = nft.name.match(/#(\d+)/)
  return match ? `#${match[1].padStart(4, '0')}` : '#0000'
}

export function getNftDetail(id: string): NftDetail | null {
  const nft = findNft(id)
  if (!nft) return null

  const network = labelOf(networks, nft.network)
  const collection = labelOf(collections, nft.collection)
  const emerald = nft.id === 'emerald-ape-042'
  const open = readScenario() !== 'esgotado' && readNftPatch(nft.id)?.available !== false

  return {
    ...nft,
    about: emerald
      ? 'Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na Ethereum, com arte desbloqueável e acesso para colecionadores.'
      : `${nft.name} faz parte da coleção ${collection}, verificado na ${network}.`,
    paragraphs: emerald
      ? [
          'Emerald Ape #042 é uma obra digital 1/50 finalizada à mão da coleção Kurio Editions. Cada atributo fica armazenado nos metadados do token e verificado na Ethereum. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.',
          'A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. Nova Sato recebe 5% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.',
        ]
      : [
          `${nft.name} é uma obra da coleção ${collection}. Os atributos ficam nos metadados do token e a procedência é verificada na ${network}.`,
        ],
    editions: [
      { id: '1-1', label: '1/1', available: emerald && open, maxQuantity: 1 },
      { id: '1-10', label: '1/10', available: open, maxQuantity: 10 },
      { id: '1-50', label: '1/50', available: open, maxQuantity: 50 },
    ],
    tokenId: tokenId(nft),
    collectionName: emerald ? 'Kurio Apes' : collection,
    attributes: emerald ? ['Óculos', 'Esmeralda', 'Raro'] : [collection],
    reviewCount: emerald ? 19 : 0,
    networkNote: `Cunhado na ${network} com procedência imutável e metadados armazenados no IPFS.`,
    contractNote:
      'Direitos autorais do criador: 5% nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.',
    rightsNote: emerald
      ? '0x7A42...19E8 · Contrato inteligente ERC-721 verificado.'
      : 'Contrato inteligente ERC-721 verificado.',
    favorite: isFavorite(nft.id),
    related: relatedNfts(nft.id),
    gallery: emerald ? [nft.image, emeraldAlt, emeraldClose] : [nft.image],
  }
}
