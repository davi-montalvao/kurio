import { Link } from '@tanstack/react-router'
import { formatEth } from '../../lib/format'
import type { NftSummary } from '../../types/nft'

export function NftCard({
  nft,
  home = false,
  related = false,
}: {
  nft: NftSummary
  home?: boolean
  related?: boolean
}) {
  return (
    <Link
      to="/nfts/$nftId"
      params={{ nftId: nft.id }}
      className={
        home || related
          ? 'flex flex-col gap-3 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kprimary'
          : 'block rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ember'
      }
    >
      {home || related ? (
        <span
          className={
            related
              ? 'flex h-[255px] items-start justify-center bg-ksurface px-1 pt-5'
              : 'flex h-[300px] items-start justify-center bg-ksurface pt-[30px]'
          }
        >
          <img
            src={nft.image}
            alt={nft.name}
            className={
              related
                ? 'aspect-square w-full max-w-[212px] rounded-[13px] object-cover'
                : 'aspect-square w-full max-w-[250px] rounded-[15px] object-cover'
            }
          />
        </span>
      ) : (
        <img
          src={nft.image}
          alt=""
          className="aspect-square w-full rounded-xl object-cover"
        />
      )}
      <span className={related ? 'flex flex-col' : undefined}>
      <p
        className={
          related
            ? 'text-[15px] text-ktext'
            : home
              ? 'text-base leading-4 text-ktext'
              : 'mt-3 text-sm'
        }
      >
        {nft.name}
      </p>
      <p
        className={
          related
            ? 'text-base leading-4 font-bold text-kaccent'
            : home
              ? 'mt-2 text-lg leading-4 font-bold text-kaccent'
              : 'mt-1 text-sm font-semibold text-ember'
        }
      >
        {formatEth(nft.priceEth)} ETH
        {nft.compareAtPriceEth ? (
          <span className="ml-2 font-normal text-kmuted line-through">
            {formatEth(nft.compareAtPriceEth)} ETH
          </span>
        ) : null}
      </p>
      </span>
    </Link>
  )
}

export function NftCardSkeleton() {
  return (
    <div>
      <div className="skeleton aspect-square rounded-xl" />
      <div className="skeleton mt-3 h-4 w-2/3 rounded" />
      <div className="skeleton mt-2 h-4 w-1/3 rounded" />
    </div>
  )
}
