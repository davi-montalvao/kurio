import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from '@tanstack/react-router'
import { useState } from 'react'
import { NftCard } from '../components/home/nft-card'
import { NftGallery } from '../components/nft/nft-gallery'
import { NftPurchase } from '../components/nft/nft-purchase'
import { Footer } from '../components/footer'
import { SiteHeader } from '../components/site-header'
import { api } from '../lib/api'
import { cn } from '../lib/cn'
import type { NftDetail } from '../types/nft'

export function NftPage() {
  const { nftId } = useParams({ from: '/nfts/$nftId' })
  const [tab, setTab] = useState<'detalhes' | 'avaliacoes'>('detalhes')
  const nft = useQuery({
    queryKey: ['nft', nftId],
    queryFn: async ({ signal }) => {
      const response = await api.get<NftDetail>(`/nfts/${nftId}`, { signal })
      return response.data
    },
  })

  return (
    <div className="min-h-svh bg-kbg font-mono text-ktext">
      <div className="hidden lg:block">
        <SiteHeader active="mercado" line={false} />
      </div>
      <div className="lg:hidden">
        {nft.data ? <NftPurchase nft={nft.data} mobile /> : null}
      </div>
      <main
        className={cn(
          'mx-auto max-w-[1120px] px-4 py-4 lg:mt-8 lg:max-w-[1200px] lg:px-0 lg:py-0 lg:pb-24',
          nft.data && 'hidden lg:block',
        )}
      >
        <p className="mb-3 hidden text-[15px] leading-4 font-bold text-ktext lg:block">
          <Link to="/" className="hover:text-kaccent">
            Início
          </Link>
          <span> / Mercado</span>
        </p>

        {nft.isPending ? (
          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <div className="skeleton aspect-square rounded-2xl" />
            <div className="space-y-3">
              <div className="skeleton h-10 w-2/3 rounded" />
              <div className="skeleton h-6 w-1/3 rounded" />
              <div className="skeleton h-24 rounded" />
            </div>
          </div>
        ) : null}

        {nft.isError ? (
          <div className="mt-10" role="alert">
            <h1 className="text-2xl font-semibold">NFT não encontrado</h1>
            <Link to="/" className="mt-4 inline-block text-ember">
              Voltar ao início
            </Link>
          </div>
        ) : null}

        {nft.data ? (
          <>
            <section className="hidden items-start gap-8 lg:grid lg:grid-cols-[573px_minmax(0,1fr)]">
              <NftGallery name={nft.data.name} images={nft.data.gallery ?? []} />
              <NftPurchase nft={nft.data} />
            </section>

            <div className="mt-24 hidden lg:block">
              <div className="flex gap-8" role="tablist" aria-label="Informações do NFT">
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'detalhes'}
                  className={cn(
                    'border-b-[3px] pb-3 text-[17px] leading-4',
                    tab === 'detalhes'
                      ? 'border-kprimary font-bold text-kaccent'
                      : 'border-transparent font-normal text-ktext hover:text-kaccent',
                  )}
                  onClick={() => setTab('detalhes')}
                >
                  Detalhes do NFT
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'avaliacoes'}
                  className={cn(
                    'border-b-[3px] pb-3 text-[17px] leading-4',
                    tab === 'avaliacoes'
                      ? 'border-kprimary font-bold text-kaccent'
                      : 'border-transparent font-normal text-ktext hover:text-kaccent',
                  )}
                  onClick={() => setTab('avaliacoes')}
                >
                  Avaliações de colecionadores ({nft.data.reviewCount})
                </button>
              </div>
              <div className="h-px bg-kprimary/30" />
            </div>

            {tab === 'detalhes' ? (
              <section className="mt-3 hidden text-sm leading-6 text-kmuted lg:block" role="tabpanel">
                {(nft.data.paragraphs ?? []).map((paragraph) => (
                  <p key={paragraph} className="mb-6 last:mb-0">
                    {paragraph}
                  </p>
                ))}
                <dl className="mt-3 flex flex-col gap-3">
                  <div>
                    <dt className="text-sm leading-6 font-bold text-ktext">Rede:</dt>
                    <dd>{nft.data.networkNote}</dd>
                  </div>
                  <div>
                    <dt className="text-sm leading-6 font-bold text-ktext">Contrato:</dt>
                    <dd>{nft.data.contractNote}</dd>
                  </div>
                  <div>
                    <dt className="text-sm leading-6 font-bold text-ktext">Direitos autorais:</dt>
                    <dd>{nft.data.rightsNote}</dd>
                  </div>
                </dl>
              </section>
            ) : (
              <section className="mt-3 hidden text-sm leading-6 text-kmuted lg:block" role="tabpanel">
                <p>{nft.data.reviewCount} avaliações de colecionadores.</p>
              </section>
            )}

            {(nft.data.related ?? []).length > 0 ? (
              <section className="mt-24 hidden lg:block">
                <div className="flex flex-col gap-3">
                  <h2 className="text-[17px] leading-4 font-bold text-kaccent">Mais desta coleção</h2>
                  <div className="h-px bg-kprimary/30" />
                </div>
                <ul className="mt-8 grid grid-cols-5 gap-7">
                  {nft.data.related.map((item) => (
                    <li key={item.id}>
                      <NftCard nft={item} related />
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex justify-center gap-2" aria-hidden="true">
                  <span className="size-3 rounded-full border-[1.3px] border-kprimary" />
                  <span className="size-3 rounded-full bg-kprimary" />
                  <span className="size-3 rounded-full border-[1.3px] border-kprimary" />
                </div>
              </section>
            ) : null}
          </>
        ) : null}
      </main>
      <div className="hidden lg:block">
        <Footer />
      </div>
    </div>
  )
}
