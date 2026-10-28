import { useNavigate } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type { CatalogSearch } from '../../types/catalog-search'

type MobileHomeBarProps = {
  filtersOpen: boolean
  onToggleFilters: () => void
}

export function MobileHomeBar({ filtersOpen, onToggleFilters }: MobileHomeBarProps) {
  const navigate = useNavigate()
  const [draft, setDraft] = useState('')

  function submitSearch(event: FormEvent) {
    event.preventDefault()
    const q = draft.trim() || undefined
    navigate({
      to: '/',
      search: (current: CatalogSearch) => ({
        ...current,
        q,
        pagina: undefined,
      }),
    })
  }

  return (
    <div className="mx-auto flex w-full items-center gap-3 px-6 pt-4 md:hidden">
      <form
        role="search"
        className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-xl bg-panel px-3"
        onSubmit={submitSearch}
      >
        <Search size={16} className="shrink-0 text-[#C4A484]" aria-hidden="true" />
        <input
          value={draft}
          aria-label="Buscar NFTs"
          placeholder="Explorar coleções"
          className="h-full w-full bg-transparent text-sm text-white outline-none placeholder:text-[#C4A484]"
          onChange={(event) => setDraft(event.target.value)}
        />
      </form>
      <button
        type="button"
        className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#D28A4C] text-ink"
        aria-label="Filtros"
        aria-expanded={filtersOpen}
        onClick={onToggleFilters}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 8.25h9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="16.75" cy="8.25" r="2.35" stroke="currentColor" strokeWidth="2.2" />
          <circle cx="7.25" cy="15.75" r="2.35" stroke="currentColor" strokeWidth="2.2" />
          <path d="M12 15.75h9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}
