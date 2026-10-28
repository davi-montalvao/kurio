export type CatalogSort = 'recentes' | 'preco-asc' | 'preco-desc'
export type CatalogTab = 'todos' | 'novos' | 'alta'

export type CatalogSearch = {
  q?: string
  colecao?: string[]
  rede?: string[]
  precoMin?: string
  precoMax?: string
  ordenar?: CatalogSort
  aba?: CatalogTab
  pagina?: number
}

const sorts: CatalogSort[] = ['recentes', 'preco-asc', 'preco-desc']
const tabs: CatalogTab[] = ['todos', 'novos', 'alta']

function readList(value: unknown) {
  if (Array.isArray(value)) {
    const items = value.filter((item) => typeof item === 'string' && item)
    return items.length ? items : undefined
  }

  if (typeof value === 'string' && value) {
    return [value]
  }

  return undefined
}

export function validateCatalogSearch(
  search: Record<string, unknown>,
): CatalogSearch {
  const pagina = Number(search.pagina)
  const ordenar = sorts.find((item) => item === search.ordenar)
  const aba = tabs.find((item) => item === search.aba)

  return {
    q: typeof search.q === 'string' && search.q ? search.q : undefined,
    colecao: readList(search.colecao),
    rede: readList(search.rede),
    precoMin:
      typeof search.precoMin === 'string' && search.precoMin
        ? search.precoMin
        : undefined,
    precoMax:
      typeof search.precoMax === 'string' && search.precoMax
        ? search.precoMax
        : undefined,
    ordenar: ordenar === 'recentes' ? undefined : ordenar,
    aba: aba === 'todos' ? undefined : aba,
    pagina: Number.isInteger(pagina) && pagina > 1 ? pagina : undefined,
  }
}
