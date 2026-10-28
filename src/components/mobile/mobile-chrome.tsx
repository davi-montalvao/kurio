import { useRouter } from '@tanstack/react-router'
import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { ArrowLeftIcon } from '../icons/MobileIcons'
import { cn } from '../../lib/cn'

export function MobileScreenHeader({ title }: { title: string }) {
  const router = useRouter()

  function back() {
    const index = window.history.state?.idx
    if (typeof index === 'number' && index > 0) {
      router.history.back()
      return
    }
    void router.navigate({ to: '/' })
  }

  return (
    <header className="flex items-center gap-3 px-6 py-4 font-mono">
      <button
        type="button"
        aria-label="Voltar"
        className="grid size-[35px] place-items-center rounded-full border border-kborder bg-ksurface-3 text-kplaceholder"
        onClick={back}
      >
        <ArrowLeftIcon size={20} />
      </button>
      <h1 className="text-xl leading-4 font-bold text-ktext">{title}</h1>
    </header>
  )
}

export function IconButtonCircle({
  size = 35,
  label,
  className,
  children,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { size?: 28 | 35; label: string }) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cn(
        'grid place-items-center rounded-full border border-kborder bg-ksurface-3 text-kplaceholder',
        className,
      )}
      style={{ width: size, height: size }}
      {...props}
    >
      {children}
    </button>
  )
}

export function BottomSheetBar({ children }: { children: ReactNode }) {
  const barRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    const bar = barRef.current
    if (!bar) return
    const measure = () => setHeight(bar.offsetHeight)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(bar)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <div aria-hidden="true" style={{ height }} />
      <div
        ref={barRef}
        className="fixed inset-x-0 bottom-0 z-20 rounded-t-[40px] bg-ksurface shadow-sheet"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {children}
      </div>
    </>
  )
}
