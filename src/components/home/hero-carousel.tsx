import Autoplay from 'embla-carousel-autoplay'
import { useEffect, useMemo, useRef, useState, type FocusEvent, type ReactNode } from 'react'
import type { HeroSlide } from '../../contracts/content'
import { cn } from '../../lib/cn'
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '../ui/carousel'

type HeroCarouselProps = {
  slides: HeroSlide[]
  dots: 'mobile' | 'desktop'
  fill?: boolean
  children: (slide: HeroSlide) => ReactNode
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return reduced
}

export function HeroCarousel({ slides, dots, fill = false, children }: HeroCarouselProps) {
  const reduced = useReducedMotion()
  const many = slides.length > 1
  const playing = many && !reduced
  const plugins = useMemo(
    () =>
      playing
        ? [
            Autoplay({
              delay: 5000,
              playOnInit: true,
              stopOnInteraction: false,
              stopOnMouseEnter: false,
              stopOnFocusIn: false,
            }),
          ]
        : [],
    [playing],
  )
  const [api, setApi] = useState<CarouselApi>()
  const [selected, setSelected] = useState(0)
  const [announce, setAnnounce] = useState(false)
  const [paused, setPaused] = useState(false)
  const manual = useRef(false)
  const hold = useRef({ paused: false, hover: false, focus: false, drag: false })
  const sync = useRef(() => {})

  useEffect(() => {
    if (!api) return
    const run = () => {
      const plugin = api.plugins()?.autoplay
      if (!plugin || !playing) return
      const block = hold.current.paused || hold.current.hover || hold.current.focus || hold.current.drag
      if (block) plugin.stop()
      else plugin.play()
    }
    sync.current = run
    const onSelect = () => {
      const user = manual.current
      manual.current = false
      setSelected(api.selectedScrollSnap())
      setAnnounce(user)
    }
    const onDown = () => {
      manual.current = true
      hold.current.drag = true
      run()
    }
    const onSettle = () => {
      manual.current = false
      hold.current.drag = false
      run()
    }
    api.on('select', onSelect)
    api.on('pointerDown', onDown)
    api.on('settle', onSettle)
    return () => {
      sync.current = () => {}
      api.off('select', onSelect)
      api.off('pointerDown', onDown)
      api.off('settle', onSettle)
    }
  }, [api, playing])

  function markManual() {
    manual.current = true
  }

  function togglePause() {
    hold.current.paused = !hold.current.paused
    setPaused(hold.current.paused)
    sync.current()
  }

  function onFocus(event: FocusEvent<HTMLDivElement>) {
    if (event.currentTarget.contains(event.relatedTarget)) return
    hold.current.focus = true
    sync.current()
  }

  function onBlur(event: FocusEvent<HTMLDivElement>) {
    if (event.currentTarget.contains(event.relatedTarget)) return
    hold.current.focus = false
    sync.current()
  }

  return (
    <Carousel
      fill={fill}
      opts={{ loop: many }}
      plugins={plugins}
      setApi={setApi}
      onManual={markManual}
      className={cn(fill && 'flex h-full min-h-0 flex-col')}
      onMouseEnter={() => {
        hold.current.hover = true
        sync.current()
      }}
      onMouseLeave={() => {
        hold.current.hover = false
        sync.current()
      }}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <CarouselContent>
        {slides.map((slide, index) => (
          <CarouselItem
            key={slide.id}
            className={fill ? 'h-full' : undefined}
            aria-label={`${index + 1} de ${slides.length}`}
            aria-hidden={index === selected ? undefined : true}
            inert={index === selected ? undefined : true}
          >
            {children(slide)}
          </CarouselItem>
        ))}
      </CarouselContent>
      {many ? (
        <div
          className={cn(
            'hero-dots',
            dots === 'mobile' && 'mt-4 mb-3',
            dots === 'desktop' && 'hero-dots-desktop mt-11 max-w-[600px] min-[1440px]:ml-10',
          )}
        >
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              className="hero-dot"
              aria-label={`Ir para o destaque ${index + 1} de ${slides.length}`}
              aria-current={index === selected ? 'true' : undefined}
              onClick={() => {
                markManual()
                api?.scrollTo(index)
              }}
            />
          ))}
        </div>
      ) : null}
      {playing ? (
        <button
          type="button"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:right-2 focus:z-20 focus:bg-kbg focus:px-2 focus:py-1 focus:text-sm"
          onClick={togglePause}
        >
          {paused ? 'Retomar destaques' : 'Pausar destaques'}
        </button>
      ) : null}
      <div aria-live={announce ? 'polite' : 'off'} className="sr-only">
        {announce ? `Destaque ${selected + 1} de ${slides.length}` : ''}
      </div>
    </Carousel>
  )
}
