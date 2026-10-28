export type AuthMode = 'login' | 'signup'

export type AuthSearch = {
  auth?: AuthMode
  redirect?: string
  reason?: 'expired'
}

export function readRedirect(value: unknown) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
    ? value
    : undefined
}

export function readAuthSearch(search: Record<string, unknown>): AuthSearch {
  const auth = search.auth === 'login' || search.auth === 'signup' ? search.auth : undefined
  const reason = search.reason === 'expired' ? 'expired' : undefined
  return {
    auth,
    redirect: readRedirect(search.redirect),
    reason,
  }
}

export function authHref(pathname: string, search: string, patch: AuthSearch) {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  if (patch.auth) params.set('auth', patch.auth)
  else params.delete('auth')
  if (patch.redirect) params.set('redirect', patch.redirect)
  else params.delete('redirect')
  if (patch.reason) params.set('reason', patch.reason)
  else params.delete('reason')
  const query = params.toString()
  return query ? `${pathname}?${query}` : pathname
}
