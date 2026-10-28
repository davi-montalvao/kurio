const scenarioKey = 'kurio-scenario'

export const scenarios = ['normal', 'lentidao', 'erro', 'sessao-expirada', 'esgotado', 'timeout', 'vazio', 'favorito'] as const

export type Scenario = (typeof scenarios)[number]

export function readScenario(): Scenario {
  const value = sessionStorage.getItem(scenarioKey)
  return scenarios.includes(value as Scenario) ? (value as Scenario) : 'normal'
}

export function applyScenarioFromUrl() {
  const params = new URLSearchParams(window.location.search)
  if (params.get('reset') === '1') {
    localStorage.removeItem('kurio-mock-store')
    sessionStorage.removeItem('kurio-nft-bump')
    sessionStorage.removeItem('kurio-checkout-order')
    sessionStorage.removeItem('kurio-expire-session')
    sessionStorage.removeItem(scenarioKey)
    params.delete('reset')
    params.delete('cenario')
    const query = params.toString()
    window.location.replace(query ? `${window.location.pathname}?${query}` : window.location.pathname)
    return 'reload' as const
  }

  const name = params.get('cenario')
  if (!name || !scenarios.includes(name as Scenario)) return 'ready' as const
  sessionStorage.setItem(scenarioKey, name)
  if (name === 'sessao-expirada') sessionStorage.setItem('kurio-expire-session', '1')
  else sessionStorage.removeItem('kurio-expire-session')
  return 'ready' as const
}
