import { Search, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { cn } from '../../lib/cn'

type NftGalleryProps = {
  name: string
  images: string[]
}

export function NftGallery({ name, images }: NftGalleryProps) {
  const [selected, setSelected] = useState(0)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const shots = images.length > 0 ? images : []

  return (
    <div className="flex h-[448px] items-center gap-7">
      <ul className="flex shrink-0 flex-col gap-4">
        {shots.map((shot, index) => (
          <li key={index}>
            <button
              type="button"
              aria-label={`Imagem ${index + 1} de ${name}`}
              aria-pressed={selected === index}
              className={cn(
                'block size-[100px] overflow-hidden rounded-md bg-ksurface hover:opacity-90',
                selected === index && 'border border-kprimary',
              )}
              onClick={() => setSelected(index)}
            >
              <img src={shot} alt="" className="size-full rounded-lg object-cover" />
            </button>
          </li>
        ))}
      </ul>

      <div className="relative size-[444px] shrink-0 rounded-md bg-ksurface p-4">
        <img
          src={shots[selected]}
          alt={name}
          className="size-[404px] rounded-3xl object-cover"
        />
        <button
          type="button"
          className="absolute top-[13px] right-[14px] grid size-[30px] place-items-center rounded-full border border-kborder bg-ksurface-3 text-ktext hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-kprimary"
          aria-label="Ampliar imagem"
          onClick={() => dialogRef.current?.showModal()}
        >
          <Search size={20} />
        </button>
      </div>

      <dialog
        ref={dialogRef}
        className="nft-zoom rounded-2xl bg-kbg p-4 text-ktext"
        aria-label={name}
      >
        <div className="relative">
          <form method="dialog" className="absolute top-3 right-3">
            <button
              type="submit"
              className="grid size-8 place-items-center rounded-full bg-kbg/80 text-ktext focus-visible:outline focus-visible:outline-2 focus-visible:outline-kprimary"
              aria-label="Fechar imagem"
            >
              <X size={18} />
            </button>
          </form>
          <img
            src={shots[selected]}
            alt={name}
            className="block h-auto w-[min(720px,80vh,calc(100vw-64px))] max-h-[80vh] rounded-xl object-contain"
          />
        </div>
      </dialog>
    </div>
  )
}
