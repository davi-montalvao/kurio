import { Link } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import type { NftSummary } from '../../types/nft'

export function MobileNftCard({ nft }: { nft: NftSummary }) {
  return (
    <Link
      to="/nfts/$nftId"
      params={{ nftId: nft.id }}
      className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ember"
    >
      <span className="relative block">
        <img
          src={nft.image}
          alt=""
          className="aspect-square w-full rounded-2xl object-cover"
        />
        <Heart
          size={14}
          className="absolute top-2 right-2 text-white"
          aria-hidden="true"
        />
      </span>
      <p className="mt-2 text-sm">{nft.name}</p>
      <p className="mt-1 text-sm font-semibold text-[#E89B55]">{nft.priceEth} ETH</p>
    </Link>
  )
}
