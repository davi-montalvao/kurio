import useEmblaCarousel, { type UseEmblaCarouselType } from 'embla-carousel-react'
import {
  useEffect,
  createContext,
  useContext,
  type ComponentProps,
  type KeyboardEvent,
} from 'react'
import { cn } from '../../lib/cn'

export type CarouselApi = UseEmblaCarouselType[1]

type CarouselOptions = Parameters<typeof useEmblaCarousel>[0]
type CarouselPlugin = Parameters<typeof useEmblaCarousel>[1]

type CarouselProps = ComponentProps<'div'> & {
  opts?: CarouselOptions
  plugins?: CarouselPlugin
  setApi?: (api: CarouselApi) => void
  onManual?: () => void
  fill?: boolean
}

type CarouselContextValue = {
  viewportRef: UseEmblaCarouselType[0]
  api: CarouselApi
  fill: boolean
  scrollPrev: () => void
  scrollNext: () => void
}

const CarouselContext = createContext<CarouselContextValue | null>(null)

function useCarousel() {
  const value = useContext(CarouselContext)
  if (!value) throw new Error('O carrossel precisa estar dentro de Carousel.')
  return value
}

export function Carousel({
  opts,
  plugins,
  setApi,
  onManual,
  fill = false,
  className,
  children,
  onKeyDown,
  ...props
}: CarouselProps) {
  const [viewportRef, api] = useEmblaCarousel(opts, plugins)

  useEffect(() => {
    if (!api || !setApi) return
    setApi(api)
  }, [api, setApi])

  function scrollPrev() {
    onManual?.()
    api?.scrollPrev()
  }

  function scrollNext() {
    onManual?.()
    api?.scrollNext()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      scrollPrev()
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      scrollNext()
    }
    onKeyDown?.(event)
  }

  return (
    <CarouselContext.Provider value={{ viewportRef, api, fill, scrollPrev, scrollNext }}>
      <div onKeyDown={handleKeyDown} className={cn(className)} {...props}>
        {children}
      </div>
    </CarouselContext.Provider>
  )
}

export function CarouselContent({ className, children }: ComponentProps<'div'>) {
  const { viewportRef, fill } = useCarousel()

  return (
    <div ref={viewportRef} className={cn('overflow-hidden', fill && 'min-h-0 flex-1', className)}>
      <div className={cn('flex', fill && 'h-full')}>{children}</div>
    </div>
  )
}

export function CarouselItem({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      role="group"
      aria-roledescription="slide"
      className={cn('min-w-0 shrink-0 grow-0 basis-full', className)}
      {...props}
    />
  )
}
