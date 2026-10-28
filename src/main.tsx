import '@fontsource-variable/inter'
import '@fontsource/roboto-mono/400.css'
import '@fontsource/roboto-mono/500.css'
import '@fontsource/roboto-mono/700.css'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { api } from './lib/api'
import { queryClient } from './lib/query-client'
import { Realtime } from './lib/realtime'
import { applyScenarioFromUrl } from './mocks/scenario'
import { router } from './router'

const reloadKey = 'kurio-msw-reload'

function reloadOnce() {
  if (sessionStorage.getItem(reloadKey)) return
  sessionStorage.setItem(reloadKey, '1')
  location.reload()
}

async function mocksRespond() {
  const response = await fetch('/api/session', {
    headers: { accept: 'application/json' },
  })
  return (response.headers.get('content-type') ?? '').includes('application/json')
}

function pageToResume() {
  const params = new URLSearchParams(window.location.search)
  params.delete('auth')
  params.delete('reason')
  params.delete('redirect')
  const query = params.toString()
  return query ? `${window.location.pathname}?${query}` : window.location.pathname
}

let expiryRedirect = false

function redirectAfterExpiry() {
  queryClient.setQueryData(['session'], null)
  queryClient.removeQueries({ queryKey: ['wallets'] })
  queryClient.removeQueries({ queryKey: ['favorites'] })
  queryClient.removeQueries({ queryKey: ['order'] })
  queryClient.removeQueries({ queryKey: ['cart'] })
  const current = new URLSearchParams(window.location.search)
  if (expiryRedirect || window.location.pathname === '/entrar') return
  if (current.get('auth') === 'login' && current.get('reason') === 'expired') return
  expiryRedirect = true
  const back = pageToResume()
  const desktop = window.matchMedia('(min-width: 768px)').matches
  if (!desktop) {
    const search = new URLSearchParams()
    search.set('redirect', back)
    search.set('reason', 'expired')
    void router.navigate({ href: `/entrar?${search.toString()}`, replace: true })
  } else {
    const next = new URLSearchParams()
    const backUrl = new URL(back, window.location.origin)
    backUrl.searchParams.forEach((value, key) => next.set(key, value))
    next.set('auth', 'login')
    next.set('reason', 'expired')
    next.set('redirect', back)
    void router.navigate({
      href: `${window.location.pathname}?${next.toString()}`,
      replace: true,
    })
  }
  window.setTimeout(() => {
    expiryRedirect = false
  }, 1500)
}

function watchMocks() {
  api.interceptors.response.use(
    (response) => {
      sessionStorage.removeItem(reloadKey)
      return response
    },
    (error: {
      response?: { status?: number; headers?: { 'content-type'?: string }; data?: { code?: string } }
    }) => {
      const type = String(error.response?.headers?.['content-type'] ?? '')
      if (error.response?.status === 404 && !type.includes('json')) reloadOnce()
      if (error.response?.data?.code === 'session_expired') redirectAfterExpiry()
      return Promise.reject(error)
    },
  )

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return
    void mocksRespond().then((ok) => {
      if (ok) sessionStorage.removeItem(reloadKey)
      else reloadOnce()
    })
  })
}

async function enableMocks() {
  if (import.meta.env.VITE_ENABLE_MSW === 'false') {
    return
  }

  const { worker } = await import('./mocks/browser')
  await worker.start({
    onUnhandledFrame: 'bypass',
    serviceWorker: {
      options: { updateViaCache: 'none' },
    },
  })

  watchMocks()

  if (await mocksRespond()) {
    sessionStorage.removeItem(reloadKey)
    return
  }

  if (!sessionStorage.getItem(reloadKey)) {
    sessionStorage.setItem(reloadKey, '1')
    location.reload()
    await new Promise(() => {})
  }
}

if (applyScenarioFromUrl() !== 'reload') enableMocks().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <Realtime>
          <RouterProvider router={router} />
        </Realtime>
      </QueryClientProvider>
    </StrictMode>,
  )
})
