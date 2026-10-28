import { centsToEth, ethToCents } from '../../lib/eth'
import { cn } from '../../lib/cn'
import type { CatalogFacet } from '../../types/nft'

type CatalogFiltersProps = {
  collections: CatalogFacet[]
  networks: CatalogFacet[]
  selectedCollections: string[]
  selectedNetworks: string[]
  min: string
  max: string
  onToggleCollection: (id: string) => void
  onToggleNetwork: (id: string) => void
  onPriceChange: (min: string, max: string) => void
  onApplyPrice: () => void
  desktop?: boolean
}

function cents(value: string) {
  return ethToCents(value)
}

function fromCents(value: number) {
  return centsToEth(value)
}

const priceMin = 2
const priceMax = 1230

function FilterRow({
  label,
  count,
  checked,
  boldCount,
  desktop,
  onChange,
}: {
  label: string
  count: number
  checked: boolean
  boldCount?: boolean
  desktop?: boolean
  onChange: () => void
}) {
  return (
    <li>
      <label
        className={cn(
          'flex cursor-pointer items-center justify-between gap-3 text-sm',
          desktop && 'h-10 text-[15px] leading-10',
          checked ? 'text-kaccent' : 'text-kmuted',
        )}
      >
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={onChange}
        />
        <span>{label}</span>
        <span className={boldCount ? 'font-bold' : undefined}>({count})</span>
      </label>
    </li>
  )
}

export function CatalogFilters({
  collections,
  networks,
  selectedCollections,
  selectedNetworks,
  min,
  max,
  onToggleCollection,
  onPriceChange,
  onToggleNetwork,
  onApplyPrice,
  desktop = false,
}: CatalogFiltersProps) {
  const minCents = cents(min)
  const maxCents = cents(max)
  const span = priceMax - priceMin
  const minPct = ((minCents - priceMin) / span) * 100
  const maxPct = ((maxCents - priceMin) / span) * 100

  return (
    <div className={cn('space-y-6 bg-surface-card p-4', desktop && 'space-y-10 bg-ksurface p-5')}>
      <fieldset className="border-0 p-0">
        <legend className={cn('text-sm font-semibold', desktop && 'text-lg leading-4 font-bold text-ktext')}>
          Coleções
        </legend>
        <ul className={cn('mt-3 space-y-2.5', desktop && 'space-y-0 px-3')}>
          {collections.map((collection) => (
            <FilterRow
              key={collection.id}
              label={collection.label}
              count={collection.count}
              checked={selectedCollections.includes(collection.id)}
              boldCount={desktop}
              desktop={desktop}
              onChange={() => onToggleCollection(collection.id)}
            />
          ))}
        </ul>
      </fieldset>

      <fieldset className="border-0 p-0">
        <legend className={cn('text-sm font-semibold', desktop && 'text-lg leading-4 font-bold text-ktext')}>
          Faixa de preço
        </legend>
        <div className={cn('mt-4 space-y-3', desktop && 'mt-3 gap-3 pl-3')}>
          <div className={cn('relative h-4', desktop && 'h-[21px]')}>
            <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-kprimary/30" />
            <div
              className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-kprimary"
              style={{ left: `${minPct}%`, width: `${maxPct - minPct}%` }}
            />
            <input
              type="range"
              min={priceMin}
              max={priceMax}
              value={minCents}
              aria-label="Preço mínimo"
              className="range-input"
              onChange={(event) => {
                const next = Math.min(Number(event.target.value), maxCents)
                onPriceChange(fromCents(next), max)
              }}
            />
            <input
              type="range"
              min={priceMin}
              max={priceMax}
              value={maxCents}
              aria-label="Preço máximo"
              className="range-input"
              onChange={(event) => {
                const next = Math.max(Number(event.target.value), minCents)
                onPriceChange(min, fromCents(next))
              }}
            />
          </div>
          <p className={cn('text-xs text-kmuted', desktop && 'text-[15px] leading-4 text-ktext')}>
            Preço: {min.replace('.', ',')} - {max.replace('.', ',')} ETH
          </p>
          <button
            type="button"
            className={cn(
              'rounded-lg bg-kprimary px-3 py-1.5 text-sm font-semibold text-kbg hover:opacity-90',
              desktop && 'rounded-md px-3 py-2 text-base leading-5 font-bold',
            )}
            onClick={onApplyPrice}
          >
            Aplicar
          </button>
        </div>
      </fieldset>

      <fieldset className="border-0 p-0">
        <legend className={cn('text-sm font-semibold', desktop && 'text-lg leading-4 font-bold text-ktext')}>
          Rede
        </legend>
        <ul className={cn('mt-3 space-y-2.5', desktop && 'mt-3 space-y-0 pl-3')}>
          {networks.map((network) => (
            <FilterRow
              key={network.id}
              label={network.label}
              count={network.count}
              checked={selectedNetworks.includes(network.id)}
              desktop={desktop}
              onChange={() => onToggleNetwork(network.id)}
            />
          ))}
        </ul>
      </fieldset>
    </div>
  )
}
