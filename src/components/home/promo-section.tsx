import { useQuery } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'
import { contentQueryOptions } from '../../queries/content'

export function PromoSection() {
  const content = useQuery(contentQueryOptions())

  if (content.isPending) {
    return <section className="skeleton mx-auto mt-24 h-[250px] max-w-[1200px]" />
  }

  if (content.isError) {
    return (
      <section className="mx-auto mt-24 max-w-[1200px]" role="alert">
        <p>Não foi possível carregar os destaques.</p>
        <button type="button" className="mt-3 text-sm font-semibold text-kaccent" onClick={() => content.refetch()}>
          Tentar de novo
        </button>
      </section>
    )
  }

  return (
    <section className="mx-auto mt-24 grid max-w-[1200px] grid-cols-2 gap-4 px-4 font-mono xl:gap-7 xl:px-0">
      {content.data.promos.map((promo) => (
        <article
          key={promo.title}
          className="relative grid min-w-0 grid-cols-[minmax(0,120px)_minmax(0,1fr)] overflow-hidden rounded-lg bg-ksurface xl:h-[250px] xl:grid-cols-[290px_1fr]"
        >
          <img src={promo.image} alt={promo.alt} className="h-full w-full object-cover" />
          <div className="relative z-10 flex min-w-0 flex-col items-end py-6 pr-4 text-right xl:py-9 xl:pr-8">
            <h2 className="text-lg leading-6 font-bold text-ktext">{promo.title}</h2>
            <p className="mt-3 w-full max-w-[260px] text-sm leading-6 text-kmuted xl:w-[260px]">{promo.text}</p>
            <a
              href="#catalogo"
              className="mt-6 inline-flex h-10 w-[140px] items-center justify-center gap-2 rounded-md bg-kprimary text-sm leading-5 font-medium text-kbg hover:opacity-90"
            >
              {promo.cta}
              <ArrowRight size={18} />
            </a>
          </div>
          <span className="pointer-events-none absolute -bottom-28 -left-48 size-64 rounded-full border-2 border-kprimary" />
          <span className="pointer-events-none absolute -bottom-36 -left-36 size-64 rounded-full border border-kprimary/40" />
        </article>
      ))}
    </section>
  )
}
