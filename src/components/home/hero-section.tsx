import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import type { HeroSlide } from '../../contracts/content'
import { contentQueryOptions } from '../../queries/content'
import { HeroCarousel } from './hero-carousel'

function HeroLink({ slide, className }: { slide: HeroSlide; className: string }) {
  const nft = /^\/nfts\/([^/]+)$/.exec(slide.ctaTarget)
  if (nft) {
    return (
      <Link to="/nfts/$nftId" params={{ nftId: nft[1] }} className={className}>
        {slide.ctaLabel}
      </Link>
    )
  }

  return (
    <a href={slide.ctaTarget} className={className}>
      {slide.ctaLabel}
    </a>
  )
}

function HeroTitle({ text, className }: { text: string; className: string }) {
  return (
    <h1 className={className}>
      {text.split('\n').map((line, index) => (
        <span key={index} className="block">
          {line}
        </span>
      ))}
    </h1>
  )
}

function HeroOrbs() {
  return (
    <>
      <div aria-hidden className="hero-bg pointer-events-none absolute inset-0" />
      <div aria-hidden className="hero-orb-1 pointer-events-none absolute rounded-full" />
      <div aria-hidden className="hero-orb-2 pointer-events-none absolute rounded-full" />
    </>
  )
}

function MobileFrame({
  children,
  label,
  busy,
  alert,
}: {
  children: ReactNode
  label?: string
  busy?: boolean
  alert?: boolean
}) {
  return (
    <section
      aria-roledescription={alert || busy ? undefined : 'carrossel'}
      aria-label={label}
      aria-busy={busy || undefined}
      role={alert ? 'alert' : undefined}
      className="relative h-[190px] overflow-hidden rounded-[30px]"
    >
      <HeroOrbs />
      <div className="relative z-10 h-full">{children}</div>
    </section>
  )
}

function MobileSlide({ slide }: { slide: HeroSlide }) {
  return (
    <div className="flex h-full items-center gap-2 px-3">
      <div className="w-[188px] shrink-0">
        <p className="text-[11px] leading-4 text-[#E7D3C2]">{slide.eyebrow}</p>
        <HeroTitle
          text={slide.title}
          className="mt-1 text-[20px] leading-[1.05] font-extrabold tracking-tight uppercase"
        />
        <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[#E7D3C2]">{slide.description}</p>
        <HeroLink slide={slide} className="mt-2 inline-flex text-xs font-semibold text-kaccent" />
      </div>
      <div className="relative size-[138px] shrink-0">
        <img
          src={slide.image.src}
          alt={slide.image.alt}
          draggable={false}
          className="size-[138px] rounded-2xl object-cover"
        />
        <img
          src={slide.thumbnail.src}
          alt={slide.thumbnail.alt}
          draggable={false}
          className="absolute bottom-0 -left-4 size-[58px] rounded-2xl border-2 border-kbg object-cover"
        />
      </div>
    </div>
  )
}

function DesktopSlide({ slide }: { slide: HeroSlide }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-6 min-[1440px]:min-h-[450px] min-[1440px]:gap-[110px] min-[1440px]:pl-10 xl:gap-10">
      <div className="flex min-w-0 max-w-[600px] flex-1 flex-col gap-6 xl:gap-8">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex min-w-0 flex-col gap-2">
            <p className="text-sm leading-4 font-medium tracking-[0.1em] text-ktext">{slide.eyebrow}</p>
            <HeroTitle
              text={slide.title}
              className="text-[32px] leading-[1.15] font-bold text-ktext uppercase xl:text-[43px] xl:leading-[70px]"
            />
          </div>
          <p className="max-w-[557px] text-sm leading-6 text-kmuted">{slide.description}</p>
        </div>
        <HeroLink
          slide={slide}
          className="inline-flex h-10 w-[140px] items-center justify-center rounded-md bg-kprimary text-base leading-5 font-bold text-kbg hover:opacity-90"
        />
      </div>
      <img
        src={slide.image.src}
        alt={slide.image.alt}
        draggable={false}
        className="size-[200px] shrink-0 rounded-3xl object-cover xl:size-[360px] min-[1440px]:size-[450px]"
      />
    </div>
  )
}

export function HeroSection() {
  const content = useQuery(contentQueryOptions())

  if (content.isPending) {
    return (
      <div className="mx-auto max-w-[1120px] px-4 py-4 lg:max-w-[1200px] lg:px-0 lg:py-0">
        <div className="md:hidden">
          <MobileFrame label="Destaques" busy>
            <div className="flex h-full items-center gap-2 px-3">
              <div className="flex w-[188px] flex-col gap-2">
                <div className="skeleton h-3 w-24" />
                <div className="skeleton h-5 w-full" />
                <div className="skeleton h-5 w-4/5" />
              </div>
              <div className="skeleton size-[138px] rounded-2xl" />
            </div>
          </MobileFrame>
        </div>
        <div className="skeleton mt-8 hidden h-[450px] md:block" />
      </div>
    )
  }

  if (content.isError) {
    return (
      <div className="mx-auto max-w-[1120px] px-4 py-4 lg:max-w-[1200px] lg:px-0 lg:py-0">
        <div className="md:hidden">
          <MobileFrame alert>
            <div className="flex h-full flex-col items-start justify-center px-4">
              <p>Não foi possível carregar o destaque.</p>
              <button
                type="button"
                className="mt-3 text-sm font-semibold text-kaccent"
                onClick={() => content.refetch()}
              >
                Tentar novamente
              </button>
            </div>
          </MobileFrame>
        </div>
        <div className="mt-8 hidden md:block" role="alert">
          <p>Não foi possível carregar o destaque.</p>
          <button
            type="button"
            className="mt-3 text-sm font-semibold text-kaccent"
            onClick={() => content.refetch()}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  const slides = content.data.heroSlides

  return (
    <div className="mx-auto max-w-[1120px] px-4 py-4 lg:max-w-[1200px] lg:px-0 lg:py-0">
      <div className="md:hidden">
        <MobileFrame label="Destaques">
          {slides.length === 0 ? null : (
            <HeroCarousel slides={slides} dots="mobile" fill>
              {(slide) => <MobileSlide slide={slide} />}
            </HeroCarousel>
          )}
        </MobileFrame>
      </div>
      <div className="mx-auto mt-8 hidden font-mono md:block">
        {slides.length === 0 ? null : (
          <section aria-roledescription="carrossel" aria-label="Destaques">
            <HeroCarousel slides={slides} dots="desktop">
              {(slide) => <DesktopSlide slide={slide} />}
            </HeroCarousel>
          </section>
        )}
      </div>
    </div>
  )
}
