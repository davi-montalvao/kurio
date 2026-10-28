import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { Eye, EyeOff } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { authLabels } from '../constants/labels'
import { api } from '../lib/api'
import type { SessionUser } from '../types/auth'

const fieldClass =
  'h-12 w-full rounded-xl border border-[#8a5a38] bg-transparent px-4 text-sm outline-none placeholder:text-[#C9A27A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-ember'

export function AuthEntry({ mode }: { mode: 'login' | 'signup' }) {
  const navigate = useNavigate()
  const search = useSearch({ strict: false })
  const redirect =
    typeof search.redirect === 'string' &&
    search.redirect.startsWith('/') &&
    !search.redirect.startsWith('//')
      ? search.redirect
      : undefined
  const [desktop, setDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches,
  )

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)')
    const sync = () => setDesktop(media.matches)
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (!desktop) return
    const params = new URLSearchParams()
    params.set('auth', mode)
    if (redirect) params.set('redirect', redirect)
    if (search.reason === 'expired') params.set('reason', 'expired')
    void navigate({ href: `/?${params.toString()}`, replace: true })
  }, [desktop, mode, navigate, redirect, search.reason])

  if (desktop) return null
  return <LoginPage initialMode={mode === 'signup' ? 'criar' : 'entrar'} />
}

export function LoginPage({ initialMode = 'entrar' }: { initialMode?: 'entrar' | 'criar' }) {
  const navigate = useNavigate()
  const search = useSearch({ strict: false })
  const redirect =
    typeof search.redirect === 'string' &&
    search.redirect.startsWith('/') &&
    !search.redirect.startsWith('//')
      ? search.redirect
      : undefined
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<'entrar' | 'criar'>(initialMode)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const session = useQuery({
    queryKey: ['session'],
    queryFn: async ({ signal }) => {
      const response = await api.get<{ user: SessionUser | null }>('/session', { signal })
      return response.data.user
    },
  })

  function goNext() {
    void navigate({ href: redirect ?? '/perfil' })
  }

  useEffect(() => {
    if (!session.data) return
    void navigate({ href: redirect ?? '/perfil' })
  }, [navigate, redirect, session.data])

  const login = useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      const response = await api.post<{ user: SessionUser }>('/session', input)
      return response.data.user
    },
    onSuccess: async () => {
      setError('')
      await queryClient.invalidateQueries({ queryKey: ['session'] })
      goNext()
    },
    onError: (reason: { response?: { data?: { message?: string } } }) => {
      setError(reason.response?.data?.message ?? 'E-mail ou senha inválidos')
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
      setError('')
      await queryClient.invalidateQueries({ queryKey: ['session'] })
      goNext()
    },
    onError: (reason: { response?: { data?: { message?: string } } }) => {
      setError(reason.response?.data?.message ?? 'Não foi possível criar a conta')
    },
  })

  function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    login.mutate({
      email: String(data.get('email') ?? ''),
      password: String(data.get('password') ?? ''),
    })
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

  return (
    <main className="flex min-h-svh flex-col bg-[#140D0A] px-8 py-16 text-white">
      <div className="mx-auto flex w-full max-w-[360px] flex-1 flex-col">
        <p className="text-center text-2xl font-semibold tracking-[0.18em]">KURIO</p>
        <h1 className="mt-12 text-center text-lg font-semibold">
          {mode === 'entrar' ? 'Entrar' : 'Criar conta'}
        </h1>
        {search.reason === 'expired' ? (
          <p className="mt-4 text-center text-sm text-[#E7D3C2]" role="status">
            {authLabels.expired}
          </p>
        ) : null}

        {mode === 'entrar' ? (
          <form className="mt-8" onSubmit={submitLogin}>
            <input
              name="email"
              type="email"
              required
              placeholder="contato@email.com"
              aria-label="E-mail"
              className={fieldClass}
            />
            <PasswordField
              name="password"
              label="Senha"
              shown={showPassword}
              onToggle={() => setShowPassword((value) => !value)}
            />
            <p className="mt-3 text-right text-sm text-[#C9A27A]">Esqueceu a senha?</p>
            {error ? (
              <p className="mt-3 text-sm text-[#E89B55]" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-[#E89B55] text-sm font-bold text-[#1A100C] disabled:opacity-50"
              disabled={login.isPending}
            >
              Entrar
            </button>
          </form>
        ) : (
          <form className="mt-8 space-y-3" onSubmit={submitSignup}>
            <input
              name="username"
              required
              placeholder="Nome de usuário"
              aria-label="Nome de usuário"
              className={fieldClass}
            />
            <input
              name="email"
              type="email"
              required
              placeholder="Digite seu e-mail"
              aria-label="E-mail"
              className={fieldClass}
            />
            <PasswordField
              name="password"
              label="Senha"
              shown={showPassword}
              onToggle={() => setShowPassword((value) => !value)}
            />
            <PasswordField
              name="confirmPassword"
              label="Confirmar senha"
              shown={showConfirm}
              onToggle={() => setShowConfirm((value) => !value)}
            />
            {error ? (
              <p className="text-sm text-[#E89B55]" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center rounded-xl bg-[#E89B55] text-sm font-bold text-[#1A100C] disabled:opacity-50"
              disabled={signup.isPending}
            >
              Criar conta
            </button>
          </form>
        )}

        <div className="mt-8 flex items-center gap-3">
          <span className="h-px flex-1 bg-[#3d2a20]" />
          <p className="text-xs text-[#C9A27A]">Ou continue com</p>
          <span className="h-px flex-1 bg-[#3d2a20]" />
        </div>
        <div className="mt-4 space-y-3">
          <button
            type="button"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#8a5a38] text-sm text-[#CFB28C]"
          >
            <GoogleIcon />
            Continuar com Google
          </button>
          <button
            type="button"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#8a5a38] text-sm text-[#CFB28C]"
          >
            <FacebookIcon />
            Continuar com Facebook
          </button>
        </div>

        <p className="mt-auto pt-10 text-center text-sm text-[#C9A27A]">
          {mode === 'entrar' ? 'Novo na Kurio? ' : 'Já tem conta? '}
          <button
            type="button"
            className="text-[#E7D3C2]"
            onClick={() => {
              setMode((current) => (current === 'entrar' ? 'criar' : 'entrar'))
              setError('')
            }}
          >
            {mode === 'entrar' ? 'Crie uma conta' : 'Entrar'}
          </button>
        </p>
      </div>
    </main>
  )
}

function PasswordField({
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
    <span className="relative mt-3 block">
      <input
        name={name}
        type={shown ? 'text' : 'password'}
        required
        placeholder="••••••••"
        aria-label={label}
        className={`${fieldClass} pr-12`}
      />
      <button
        type="button"
        className="absolute top-1/2 right-4 -translate-y-1/2 text-[#C9A27A]"
        aria-label={shown ? 'Ocultar senha' : 'Mostrar senha'}
        onClick={onToggle}
      >
        {shown ? <Eye size={16} /> : <EyeOff size={16} />}
      </button>
    </span>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.8.54-1.84.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.96 10.71A5.4 5.4 0 0 1 3.68 9c0-.59.1-1.17.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#1877F2"
        d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.03 1.79-4.7 4.53-4.7 1.31 0 2.69.24 2.69.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.27h3.33l-.53 3.49h-2.8V24C19.61 23.09 24 18.1 24 12.07z"
      />
    </svg>
  )
}
