import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { readWallet, WalletForm, walletClientErrors } from '../components/account/wallet-form'
import { readApiError } from '../lib/api-error'
import { api } from '../lib/api'
import { walletsQueryOptions } from '../queries/wallets'
import type { CollectorWallet, UserWallets } from '../types/wallet'

export function WalletsPage() {
  const queryClient = useQueryClient()
  const wallets = useQuery(walletsQueryOptions())
  const [fresh, setFresh] = useState(false)
  const [draft, setDraft] = useState(0)
  const [secondaryOpen, setSecondaryOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [primaryErrors, setPrimaryErrors] = useState<Record<string, string>>({})
  const [secondaryErrors, setSecondaryErrors] = useState<Record<string, string>>({})

  const data = wallets.data
  const primary = fresh ? null : (data?.primary ?? null)
  const showSecondary = Boolean(data && !data.sameAsPrimary && (secondaryOpen || data.secondary))

  const savePrimary = useMutation({
    mutationFn: async (input: CollectorWallet) => {
      const path = data?.primary && !fresh ? '/wallets/primary' : '/wallets'
      const method = data?.primary && !fresh ? 'patch' : 'post'
      const response = await api.request<UserWallets>({ url: path, method, data: input })
      return response.data
    },
    onSuccess: async () => {
      setFresh(false)
      setError('')
      setPrimaryErrors({})
      setMessage('Carteira salva')
      await queryClient.invalidateQueries({ queryKey: ['wallets'] })
    },
    onError: (reason: unknown) => {
      const parsed = readApiError(reason, 'Não foi possível salvar')
      setMessage('')
      setError(parsed.message)
      setPrimaryErrors(parsed.fields)
    },
  })

  const saveSecondary = useMutation({
    mutationFn: async (input: { sameAsPrimary: boolean; wallet: CollectorWallet | null }) => {
      if (input.sameAsPrimary || !input.wallet) {
        const response = await api.put<UserWallets>('/wallets/secondary', input)
        return response.data
      }
      const response = await api.patch<UserWallets>('/wallets/secondary', input.wallet)
      return response.data
    },
    onSuccess: async (saved) => {
      if (saved.sameAsPrimary) setSecondaryOpen(false)
      setError('')
      setSecondaryErrors({})
      setMessage(saved.secondary ? 'Carteira salva' : '')
      await queryClient.invalidateQueries({ queryKey: ['wallets'] })
    },
    onError: (reason: unknown) => {
      const parsed = readApiError(reason, 'Não foi possível salvar')
      setMessage('')
      setError(parsed.message)
      setSecondaryErrors(parsed.fields)
    },
  })

  function onPrimary(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const wallet = readWallet(new FormData(event.currentTarget))
    const problems = walletClientErrors(wallet)
    if (Object.keys(problems).length > 0) {
      setPrimaryErrors(problems)
      setMessage('')
      return
    }
    savePrimary.mutate(wallet)
  }

  function onSecondary(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const wallet = readWallet(new FormData(event.currentTarget))
    const problems = walletClientErrors(wallet)
    if (Object.keys(problems).length > 0) {
      setSecondaryErrors(problems)
      setMessage('')
      return
    }
    saveSecondary.mutate({ sameAsPrimary: false, wallet })
  }

  if (wallets.isPending) return <div className="skeleton h-96" />
  if (wallets.isError || !data) {
    return (
      <p role="alert">
        Não foi possível carregar as carteiras.{' '}
        <button type="button" className="text-kaccent" onClick={() => wallets.refetch()}>
          Tentar de novo
        </button>
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-8 pb-16">
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-[17px] leading-4 font-bold">Carteira principal</h2>
          <button
            type="button"
            className="text-base font-medium text-kaccent"
            onClick={() => {
              setFresh(true)
              setDraft((value) => value + 1)
              setMessage('')
              setError('')
              setPrimaryErrors({})
            }}
          >
            Adicionar
          </button>
        </div>
        <p className="text-sm leading-[15px] text-kmuted">
          Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
        </p>
      </header>

      <WalletForm
        key={fresh ? `nova-${draft}` : (primary?.address ?? 'vazia')}
        wallet={primary}
        errors={primaryErrors}
        pending={savePrimary.isPending}
        onSubmit={onPrimary}
      />

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-[17px] leading-4 font-bold">Carteira secundária</h2>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={data.sameAsPrimary}
                className="size-4 appearance-none rounded-full border-[1.5px] border-kprimary checked:bg-kprimary"
                onChange={(event) => {
                  setSecondaryOpen(false)
                  saveSecondary.mutate({ sameAsPrimary: event.target.checked, wallet: null })
                }}
              />
              Igual à carteira principal
            </label>
            <button
              type="button"
              className="text-base font-medium text-kaccent"
              onClick={() => {
                setSecondaryOpen(true)
                if (data.sameAsPrimary) {
                  saveSecondary.mutate({ sameAsPrimary: false, wallet: null })
                }
              }}
            >
              Adicionar
            </button>
          </div>
        </div>
        {!data.sameAsPrimary && !data.secondary && !secondaryOpen ? (
          <p className="text-sm text-kmuted">Você ainda não adicionou uma carteira secundária.</p>
        ) : null}
        {showSecondary ? (
          <WalletForm
            key={data.secondary?.address ?? 'secundaria'}
            wallet={data.secondary}
            errors={secondaryErrors}
            pending={saveSecondary.isPending}
            onSubmit={onSecondary}
          />
        ) : null}
      </section>

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
    </div>
  )
}
