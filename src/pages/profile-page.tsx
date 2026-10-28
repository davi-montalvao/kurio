import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef, useState, type FormEvent } from 'react'
import { FormField } from '../components/form/form-field'
import { ChevronDownIcon, EyeIcon, EyeOffIcon, ImageIcon } from '../components/icons/AccountIcons'
import { readApiError } from '../lib/api-error'
import { api } from '../lib/api'
import { profileQueryOptions } from '../queries/profile'
import type { SessionUser } from '../types/auth'

export function ProfilePage() {
  const session = useQuery(profileQueryOptions())
  if (!session.data) return null
  return <ProfileForm key={session.data.id} user={session.data} />
}

function ProfileForm({ user }: { user: SessionUser }) {
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [avatar, setAvatar] = useState<string | null>(user.avatar)
  const [shown, setShown] = useState({ current: false, next: false, confirm: false })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [fields, setFields] = useState<Record<string, string>>({})

  const avatarUpload = useMutation({
    mutationFn: async (next: string | null) => {
      const response = await api.post<{ user: SessionUser }>('/profile/avatar', { avatar: next })
      return response.data.user
    },
    onSuccess: async (next) => {
      setAvatar(next.avatar)
      setFields((current) => ({ ...current, avatar: '' }))
      await queryClient.invalidateQueries({ queryKey: ['session'] })
    },
    onError: (reason: unknown) => {
      const parsed = readApiError(reason, 'Não foi possível atualizar o avatar')
      setFields((current) => ({ ...current, ...parsed.fields, avatar: parsed.fields.avatar ?? parsed.message }))
    },
  })

  const save = useMutation({
    mutationFn: async (input: {
      profile: Record<string, string | null>
      password: { currentPassword: string; newPassword: string; confirmPassword: string } | null
    }) => {
      const profile = await api.patch<{ user: SessionUser }>('/profile', input.profile)
      if (input.password) await api.post('/profile/password', input.password)
      return profile.data.user
    },
    onSuccess: async () => {
      setError('')
      setFields({})
      setMessage('Perfil salvo')
      await queryClient.invalidateQueries({ queryKey: ['session'] })
    },
    onError: (reason: unknown) => {
      const parsed = readApiError(reason, 'Não foi possível salvar')
      setMessage('')
      setError(parsed.message)
      setFields(parsed.fields)
    },
  })

  function onAvatar(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setFields((current) => ({ ...current, avatar: 'Envie uma imagem.' }))
      return
    }
    if (file.size > 2_000_000) {
      setFields((current) => ({ ...current, avatar: 'A imagem passa de 2 MB.' }))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') avatarUpload.mutate(reader.result)
    }
    reader.readAsDataURL(file)
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) return
    const data = new FormData(event.currentTarget)
    const nextFields: Record<string, string> = {}
    const displayName = String(data.get('displayName') ?? '').trim()
    const username = String(data.get('username') ?? '').trim()
    const email = String(data.get('email') ?? '').trim()
    const walletNickname = String(data.get('walletNickname') ?? '').trim()
    const ensName = String(data.get('ensName') ?? '').trim()
    if (!displayName) nextFields.displayName = 'Campo obrigatório.'
    if (!username) nextFields.username = 'Campo obrigatório.'
    if (!email) nextFields.email = 'Campo obrigatório.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextFields.email = 'Informe um e-mail válido.'
    if (!walletNickname) nextFields.walletNickname = 'Campo obrigatório.'
    const currentPassword = String(data.get('currentPassword') ?? '')
    const newPassword = String(data.get('newPassword') ?? '')
    const confirmPassword = String(data.get('confirmPassword') ?? '')
    const changingPassword = Boolean(currentPassword || newPassword || confirmPassword)
    if (changingPassword) {
      if (newPassword.length < 8) nextFields.newPassword = 'A nova senha precisa ter pelo menos 8 caracteres.'
      if (newPassword !== confirmPassword) nextFields.confirmPassword = 'As senhas não conferem'
    }
    if (Object.keys(nextFields).length > 0) {
      setFields(nextFields)
      setMessage('')
      setError('Preencha os campos obrigatórios')
      return
    }
    save.mutate({
      profile: {
        displayName,
        username,
        email,
        ensName,
        ensSuffix: String(data.get('ensSuffix') ?? '.eth'),
        walletNickname,
        avatar,
      },
      password: changingPassword ? { currentPassword, newPassword, confirmPassword } : null,
    })
  }

  return (
    <form key={user.id} className="flex flex-col gap-8 pb-16" onSubmit={onSubmit}>
      <h2 className="text-base leading-4 font-bold">Perfil do colecionador</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-x-7">
        <FormField density="field" label="Nome de exibição" name="displayName" required defaultValue={user.displayName} error={fields.displayName} inputClassName="px-[13px]" />
        <FormField density="field" label="Nome de usuário" name="username" required defaultValue={user.username} error={fields.username} inputClassName="px-[13px]" />
        <FormField density="field" label="E-mail" name="email" type="email" required defaultValue={user.email} error={fields.email} inputClassName="px-[13px]" />
        <EnsNameField ensName={user.ensName} ensSuffix={user.ensSuffix} error={fields.ensName} />
        <FormField density="field" label="Apelido da carteira" name="walletNickname" required defaultValue={user.walletNickname} error={fields.walletNickname} inputClassName="px-[13px]" />
        <div>
          <p className="flex h-[29px] items-center text-[15px] leading-[15px]">Avatar</p>
          <div className="mt-2.5 flex items-center gap-6">
            <span className="grid size-[50px] place-items-center overflow-hidden rounded-full border border-kborder bg-ksurface-3 p-3">
              {avatar ? (
                <img src={avatar} alt="" className="size-full rounded-full object-cover" />
              ) : (
                <ImageIcon size={24} className="text-kprimary" />
              )}
            </span>
            <span className="flex items-center gap-5">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                aria-label="Alterar"
                onChange={(event) => onAvatar(event.target.files?.[0])}
              />
              <button
                type="button"
                className="h-10 w-[98px] rounded-[3px] bg-kprimary text-sm font-bold text-kbg"
                onClick={() => fileRef.current?.click()}
              >
                Alterar
              </button>
              <button
                type="button"
                className="text-sm font-normal text-ktext"
                onClick={() => avatarUpload.mutate(null)}
              >
                Remover
              </button>
            </span>
          </div>
          {fields.avatar ? <p className="mt-1 text-xs text-krequired">{fields.avatar}</p> : null}
        </div>
      </div>

      <div className="flex max-w-[417px] flex-col gap-6">
        <h2 className="text-base font-medium">Alterar senha</h2>
        <SecretField label="Senha atual" name="currentPassword" shown={shown.current} error={fields.currentPassword} onToggle={() => setShown((value) => ({ ...value, current: !value.current }))} />
        <SecretField label="Nova senha" name="newPassword" shown={shown.next} error={fields.newPassword} onToggle={() => setShown((value) => ({ ...value, next: !value.next }))} />
        <SecretField label="Confirmar nova senha" name="confirmPassword" shown={shown.confirm} error={fields.confirmPassword} onToggle={() => setShown((value) => ({ ...value, confirm: !value.confirm }))} />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-krequired">
          {error}
        </p>
      ) : null}
      {message ? (
        <p role="status" className="text-sm text-kmuted">
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        className="h-10 w-[131px] rounded-[3px] bg-kprimary text-sm font-bold text-kbg disabled:opacity-50"
        disabled={save.isPending}
      >
        Salvar
      </button>
    </form>
  )
}

function EnsNameField({
  ensName,
  ensSuffix,
  error,
}: {
  ensName: string
  ensSuffix: string
  error?: string
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <label htmlFor="ens-name" className="flex h-[29px] items-center gap-1 text-[15px] leading-[15px]">
        Nome ENS
        <span className="text-[22px] leading-[29px] text-krequired">*</span>
      </label>
      <span className="flex gap-2.5">
        <span className="relative shrink-0">
          <select
            name="ensSuffix"
            defaultValue={ensSuffix || '.eth'}
            aria-label="Sufixo ENS"
            className="h-10 w-[104px] appearance-none rounded-[3px] border border-kborder bg-transparent pr-8 pl-3 text-[15px] text-ktext outline-none"
          >
            <option value=".eth">.eth</option>
          </select>
          <ChevronDownIcon size={20} aria-hidden="true" className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-ktext" />
        </span>
        <input
          id="ens-name"
          name="ensName"
          defaultValue={ensName}
          aria-invalid={error ? true : undefined}
          className="h-10 w-full max-w-[329px] rounded-[3px] border border-kborder bg-transparent px-[13px] text-sm outline-none focus:border-kprimary"
        />
      </span>
      {error ? <p className="text-xs text-krequired">{error}</p> : null}
    </div>
  )
}

function SecretField({
  label,
  name,
  shown,
  error,
  onToggle,
}: {
  label: string
  name: string
  shown: boolean
  error?: string
  onToggle: () => void
}) {
  return (
    <label className="flex flex-col gap-3 text-[15px]">
      {label}
      <span className="relative block">
        <input
          name={name}
          type={shown ? 'text' : 'password'}
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          className="h-10 w-full rounded-[3px] border border-kborder bg-transparent px-4 pr-12 text-sm outline-none focus:border-kprimary"
        />
        <button
          type="button"
          className="absolute top-1/2 right-4 -translate-y-1/2 text-kplaceholder"
          aria-label={shown ? `Ocultar ${label}` : `Mostrar ${label}`}
          onClick={onToggle}
        >
          {shown ? <EyeIcon size={20} /> : <EyeOffIcon size={20} />}
        </button>
      </span>
      {error ? <span className="text-xs text-krequired">{error}</span> : null}
    </label>
  )
}
