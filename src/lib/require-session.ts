import { useQuery } from '@tanstack/react-query'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useEffect } from 'react'
import { profileQueryOptions } from '../queries/profile'

export function useRequireSession() {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const session = useQuery(profileQueryOptions())

  useEffect(() => {
    if (session.isPending || session.data) return
    const desktop = window.matchMedia('(min-width: 768px)').matches
    if (!desktop) {
      void navigate({ to: '/entrar', search: { redirect: pathname } })
      return
    }
    const params = new URLSearchParams(window.location.search)
    if (params.get('auth') === 'login' || params.get('auth') === 'signup') return
    params.set('auth', 'login')
    params.set('redirect', pathname)
    void navigate({ href: `${pathname}?${params.toString()}`, replace: true })
  }, [navigate, pathname, session.data, session.isPending])

  return session
}
