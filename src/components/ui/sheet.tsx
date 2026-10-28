import { useEffect, useRef, type ReactNode } from 'react'

type SheetProps = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  className?: string
}

export function Sheet({ open, title, onClose, children, className }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return
    const dialog = ref.current
    if (!dialog) return
    const notify = () => onCloseRef.current()
    dialog.addEventListener('close', notify)
    dialog.showModal()
    return () => {
      dialog.removeEventListener('close', notify)
      if (dialog.open) dialog.close()
    }
  }, [open])

  if (!open) return null

  return (
    <dialog
      ref={ref}
      aria-label={title}
      className={className ?? 'm-0 h-full max-h-none w-[min(100%,320px)] bg-ksurface p-0 text-ktext shadow-sheet'}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
    >
      {children}
    </dialog>
  )
}
