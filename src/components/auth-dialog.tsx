import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { authLabels } from '../constants/labels'
import { api } from '../lib/api'
import { authHref } from '../types/auth-search'
import type { SessionUser } from '../types/auth'
import { CloseIcon, EyeIcon, EyeOffIcon } from './icons/AccountIcons'

let authOpener: HTMLElement | null = null

export function rememberAuthOpener(node: HTMLElement | null) {
  authOpener = node
}

const fieldClass =
  'h-10 w-full rounded-[5px] border border-kborder bg-transparent px-4 text-sm leading-4 text-ktext outline-none placeholder:text-sm placeholder:leading-4 placeholder:font-normal placeholder:text-kplaceholder focus:border-kprimary aria-invalid:border-krequired disabled:opacity-60'

type AuthMode = 'login' | 'signup'

type ApiError = {
  response?: { status?: number; data?: { message?: string } }
}

export function AuthModal() {
  const navigate = useNavigate()
  const { pathname, searchStr } = useRouterState({
    select: (state) => ({
      pathname: state.location.pathname,
      searchStr: state.location.searchStr,
    }),
  })
  const params = new URLSearchParams(searchStr)
  const auth = params.get('auth')
  const mode: AuthMode | null = auth === 'login' || auth === 'signup' ? auth : null
  const expired = params.get('reason') === 'expired'

  function go(next: { auth?: AuthMode; redirect?: string; reason?: 'expired' }) {
    void navigate({
      href: authHref(pathname, searchStr, {
        auth: next.auth,
        redirect: next.redirect,
        reason: next.reason,
      }),
      replace: true,
    })
  }

  function close() {
    const privatePath =
      pathname.startsWith('/perfil') ||
      pathname.startsWith('/favoritos') ||
      pathname.startsWith('/pagamento') ||
      pathname.startsWith('/pedidos')
    if (privatePath) {
      void navigate({ to: '/', replace: true })
      return
    }
    go({})
  }

  if (!mode) return null

  return (
    <AuthDialog
      mode={mode}
      expired={expired}
      onClose={close}
      onMode={(next) => {
        const url = new URLSearchParams(searchStr)
        url.set('auth', next)
        void navigate({ href: `${pathname}?${url.toString()}`, replace: true })
      }}
    />
  )
}

function AuthDialog({
  mode,
  expired,
  onClose,
  onMode,
}: {
  mode: AuthMode
  expired: boolean
  onClose: () => void
  onMode: (mode: AuthMode) => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const titleId = useId()
  const descriptionId = useId()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')
  const [retryLogin, setRetryLogin] = useState<{ email: string; password: string } | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.showModal()
    const focusEmail = () => emailRef.current?.focus()
    focusEmail()
    requestAnimationFrame(focusEmail)
    return () => {
      if (dialog.open) dialog.close()
      const opener = authOpener
      authOpener = null
      requestAnimationFrame(() => {
        if (opener?.isConnected) {
          opener.focus()
          return
        }
        const live = [...document.querySelectorAll<HTMLElement>('header button')].find((node) =>
          node.textContent?.includes('Entrar'),
        )
        live?.focus()
      })
    }
  }, [])

  useEffect(() => {
    emailRef.current?.focus()
  }, [mode])

  const login = useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      const response = await api.post<{ user: SessionUser }>('/session', input)
      return response.data.user
    },
    onSuccess: async () => {
      setPassword('')
      setFormError('')
      await queryClient.invalidateQueries({ queryKey: ['session'] })
      await queryClient.invalidateQueries({ queryKey: ['cart'] })
      await queryClient.invalidateQueries({ queryKey: ['wallets'] })
      await queryClient.invalidateQueries({ queryKey: ['favorites'] })
      const redirect = new URLSearchParams(window.location.search).get('redirect')
      const next =
        redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : null
      if (next) void navigate({ href: next, replace: true })
      else onClose()
    },
    onError: (reason: ApiError) => {
      setPassword('')
      const status = reason.response?.status ?? 0
      if (status >= 500) {
        setRetryLogin({ email, password })
        setFormError(authLabels.unavailable)
        return
      }
      setRetryLogin(null)
      setFormError(reason.response?.data?.message ?? authLabels.invalidCredentials)
    },
  })

  const signup = useMutation({
    mutationFn: async (input: {
      username: string
      email: string
      password: string
      confirmPassword: string
    }) => {
      const response = await api.post<{ user: SessionUser }>('/signup', input)
      return response.data.user
    },
    onSuccess: async () => {
      setFormError('')
      await queryClient.invalidateQueries({ queryKey: ['session'] })
      await queryClient.invalidateQueries({ queryKey: ['cart'] })
      await queryClient.invalidateQueries({ queryKey: ['wallets'] })
      await queryClient.invalidateQueries({ queryKey: ['favorites'] })
      const redirect = new URLSearchParams(window.location.search).get('redirect')
      const next =
        redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : null
      if (next) void navigate({ href: next, replace: true })
      else onClose()
    },
    onError: (reason: ApiError) => {
      setFormError(reason.response?.data?.message ?? 'Não foi possível criar a conta')
    },
  })

  function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: { email?: string; password?: string } = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) nextErrors.email = authLabels.invalidEmail
    if (!password.trim()) nextErrors.password = authLabels.passwordRequired
    setFieldErrors(nextErrors)
    setNotice('')
    if (Object.keys(nextErrors).length > 0) {
      setFormError('')
      return
    }
    setRetryLogin(null)
    login.mutate({ email: email.trim(), password })
  }

  function submitSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    signup.mutate({
      username: String(data.get('username') ?? ''),
      email: String(data.get('email') ?? ''),
      password: String(data.get('password') ?? ''),
      confirmPassword: String(data.get('confirmPassword') ?? ''),
    })
  }

  const emailErrorId = `${titleId}-email`
  const passwordErrorId = `${titleId}-password`
  const loggingIn = mode === 'login'

  return (
    <dialog
      ref={dialogRef}
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className="auth-dialog font-mono text-ktext"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="flex h-full min-h-0 flex-col">
        <button
          type="button"
          aria-label={authLabels.close}
          className="absolute top-[11px] right-[12px] z-10 grid size-6 place-items-center text-kprimary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kprimary"
          onClick={onClose}
        >
          <CloseIcon size={18} />
        </button>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <header className="flex h-[140px] flex-col items-center gap-10 px-12 pt-12">
            <div role="tablist" aria-label="Conta" className="flex items-center gap-2">
              <TabButton
                selected={loggingIn}
                id={loggingIn ? titleId : undefined}
                onClick={() => onMode('login')}
              >
                {authLabels.login}
              </TabButton>
              <span aria-hidden="true" className="h-5 w-px bg-krequired" />
              <TabButton
                selected={!loggingIn}
                id={loggingIn ? undefined : titleId}
                onClick={() => onMode('signup')}
              >
                {authLabels.signup}
              </TabButton>
            </div>
            <p id={descriptionId} className="w-full max-w-[404px] text-center text-[13px] leading-4 font-normal text-ktext">
              {loggingIn ? authLabels.loginSubtitle : authLabels.signupSubtitle}
            </p>
          </header>

          {loggingIn ? (
            <form className="flex flex-col gap-3 px-20 pt-6" onSubmit={submitLogin}>
              {expired ? (
                <p className="text-xs leading-4 text-krequired" role="status">
                  {authLabels.expired}
                </p>
              ) : null}
              {formError ? (
                <p className="text-xs leading-4 text-krequired" role="alert">
                  {formError}
                  {retryLogin ? (
                    <button
                      type="button"
                      className="mt-1 block font-medium text-kaccent"
                      onClick={() => login.mutate(retryLogin)}
                    >
                      {authLabels.tryAgain}
                    </button>
                  ) : null}
                </p>
              ) : null}
              <div>
                <label htmlFor={`${titleId}-email-input`} className="sr-only">
                  {authLabels.email}
                </label>
                <input
                  ref={emailRef}
                  id={`${titleId}-email-input`}
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder={authLabels.emailPlaceholder}
                  value={email}
                  disabled={login.isPending}
                  aria-invalid={fieldErrors.email ? true : undefined}
                  aria-describedby={fieldErrors.email ? emailErrorId : undefined}
                  className={fieldClass}
                  onChange={(event) => setEmail(event.target.value)}
                />
                {fieldErrors.email ? (
                  <p id={emailErrorId} className="mt-1 text-xs leading-4 text-krequired">
                    {fieldErrors.email}
                  </p>
                ) : null}
              </div>
              <div>
                <label htmlFor={`${titleId}-password-input`} className="sr-only">
                  {authLabels.password}
                </label>
                <span className="relative block">
                  <input
                    id={`${titleId}-password-input`}
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    disabled={login.isPending}
                    aria-invalid={fieldErrors.password ? true : undefined}
                    aria-describedby={fieldErrors.password ? passwordErrorId : undefined}
                    className={`${fieldClass} pr-10 text-base`}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute top-1/2 right-4 grid size-6 -translate-y-1/2 place-items-center text-kplaceholder"
                    aria-label={showPassword ? authLabels.hidePassword : authLabels.showPassword}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? <EyeIcon size={20} /> : <EyeOffIcon size={20} />}
                  </button>
                </span>
                {fieldErrors.password ? (
                  <p id={passwordErrorId} className="mt-1 text-xs leading-4 text-krequired">
                    {fieldErrors.password}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                className="self-end text-sm leading-4 font-normal text-kaccent"
                onClick={() => setNotice(authLabels.forgotUnavailable)}
              >
                {authLabels.forgotPassword}
              </button>
              <button
                type="submit"
                className="mt-3 h-[45px] w-full rounded-[5px] bg-kprimary text-base leading-4 font-bold text-kbg disabled:opacity-60"
                disabled={login.isPending}
              >
                {authLabels.login}
              </button>
            </form>
          ) : (
            <form className="flex flex-col gap-3 px-20 pt-6" onSubmit={submitSignup}>
              {formError ? (
                <p className="text-xs leading-4 text-krequired" role="alert">
                  {formError}
                </p>
              ) : null}
              <label className="sr-only" htmlFor={`${titleId}-user`}>
                {authLabels.username}
              </label>
              <input
                ref={emailRef}
                id={`${titleId}-user`}
                name="username"
                required
                autoComplete="username"
                placeholder={authLabels.username}
                aria-label={authLabels.username}
                className={fieldClass}
              />
              <label className="sr-only" htmlFor={`${titleId}-signup-email`}>
                {authLabels.email}
              </label>
              <input
                id={`${titleId}-signup-email`}
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder={authLabels.emailPlaceholder}
                aria-label={authLabels.email}
                className={fieldClass}
              />
              <SignupPassword name="password" label={authLabels.password} shown={showPassword} onToggle={() => setShowPassword((value) => !value)} />
              <SignupPassword name="confirmPassword" label={authLabels.confirmPassword} shown={showConfirm} onToggle={() => setShowConfirm((value) => !value)} />
              <button
                type="submit"
                className="mt-3 h-[45px] w-full rounded-[5px] bg-kprimary text-base leading-4 font-bold text-kbg disabled:opacity-60"
                disabled={signup.isPending}
              >
                {authLabels.signup}
              </button>
            </form>
          )}

          <div className="pt-6">
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-kborder" />
              <p className="text-[13px] leading-4 font-normal text-ktext">{authLabels.continueWith}</p>
              <span className="h-px flex-1 bg-kborder" />
            </div>
            <div className="mt-3 flex flex-col gap-3 px-20">
              <SocialButton label={authLabels.google} onClick={() => setNotice(authLabels.socialUnavailable)}>
                <GoogleIcon />
              </SocialButton>
              <SocialButton label={authLabels.facebook} onClick={() => setNotice(authLabels.socialUnavailable)}>
                <FacebookIcon />
              </SocialButton>
              {notice ? (
                <p className="text-center text-xs leading-4 text-kmuted" role="status">
                  {notice}
                </p>
              ) : null}
            </div>
          </div>
        </div>
        <div className="h-2.5 shrink-0 bg-kprimary" />
      </div>
    </dialog>
  )
}

function TabButton({
  selected,
  id,
  onClick,
  children,
}: {
  selected: boolean
  id?: string
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      role="tab"
      id={id}
      aria-selected={selected}
      aria-current={selected ? 'true' : undefined}
      className={`text-xl leading-4 font-medium underline-offset-4 hover:underline focus-visible:underline ${selected ? 'text-kaccent' : 'text-ktext'}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function SignupPassword({
  name,
  label,
  shown,
  onToggle,
}: {
  name: string
  label: string
  shown: boolean
  onToggle: () => void
}) {
  return (
    <span className="relative block">
      <label className="sr-only" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={shown ? 'text' : 'password'}
        required
        autoComplete="new-password"
        placeholder={label}
        aria-label={label}
        className={`${fieldClass} pr-10`}
      />
      <button
        type="button"
        className="absolute top-1/2 right-4 grid size-6 -translate-y-1/2 place-items-center text-kplaceholder"
        aria-label={shown ? authLabels.hidePassword : authLabels.showPassword}
        aria-pressed={shown}
        onClick={onToggle}
      >
        {shown ? <EyeIcon size={20} /> : <EyeOffIcon size={20} />}
      </button>
    </span>
  )
}

function SocialButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className="flex h-10 w-full items-center justify-center gap-3 rounded-[5px] border border-kborder text-[13px] leading-4 font-medium text-kmuted"
      onClick={onClick}
    >
      {children}
      {label}
    </button>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.8.54-1.84.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.96 10.71A5.4 5.4 0 0 1 3.68 9c0-.59.1-1.17.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58z" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#1877F2" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.03 1.79-4.7 4.53-4.7 1.31 0 2.69.24 2.69.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.27h3.33l-.53 3.49h-2.8V24C19.61 23.09 24 18.1 24 12.07z" />
    </svg>
  )
}
