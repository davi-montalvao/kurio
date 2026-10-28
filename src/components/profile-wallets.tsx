import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { api } from '../lib/api'
import { cn } from '../lib/cn'
import { networks } from '../types/nft'
import type { CollectorWallet, UserWallets } from '../types/wallet'
import { Button } from './ui/button'

const fieldClass =
  'h-11 w-full rounded-lg border border-[#8a5a38] bg-transparent px-3 text-sm outline-none placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-ember'

const walletTypes = ['MetaMask', 'WalletConnect', 'Coinbase Wallet']

const emptyWallets: UserWallets = {
  primary: null,
  secondary: null,
  sameAsPrimary: false,
}

export function ProfileWallets() {
  const queryClient = useQueryClient()
  const [fresh, setFresh] = useState(false)
  const [draft, setDraft] = useState(0)
  const [secondaryOpen, setSecondaryOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const wallets = useQuery({
    queryKey: ['wallets'],
    queryFn: async ({ signal }) => {
      const response = await api.get<UserWallets>('/wallets', { signal })
      return response.data
    },
  })

  const data = wallets.data ?? emptyWallets
  const primary = fresh ? null : data.primary
  const showSecondaryForm = !data.sameAsPrimary && (secondaryOpen || data.secondary !== null)

  const savePrimary = useMutation({
    mutationFn: async (input: CollectorWallet) => {
      const response = await api.put<UserWallets>('/wallets/primary', input)
      return response.data
    },
    onSuccess: async () => {
      setFresh(false)
      setError('')
      setMessage('Carteira salva')
      await queryClient.invalidateQueries({ queryKey: ['wallets'] })
    },
    onError: (reason: { response?: { data?: { message?: string } } }) => {
      setMessage('')
      setError(reason.response?.data?.message ?? 'Não foi possível salvar')
    },
  })

  const saveSecondary = useMutation({
    mutationFn: async (input: { sameAsPrimary: boolean; wallet: CollectorWallet | null }) => {
      const response = await api.put<UserWallets>('/wallets/secondary', input)
      return response.data
    },
    onSuccess: async (saved) => {
      if (saved.sameAsPrimary) setSecondaryOpen(false)
      setError('')
      setMessage(saved.secondary ? 'Carteira salva' : '')
      await queryClient.invalidateQueries({ queryKey: ['wallets'] })
    },
    onError: (reason: { response?: { data?: { message?: string } } }) => {
      setMessage('')
      setError(reason.response?.data?.message ?? 'Não foi possível salvar')
    },
  })

  function onPrimary(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    savePrimary.mutate(readWallet(new FormData(event.currentTarget)))
  }

  function onSecondary(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    saveSecondary.mutate({
      sameAsPrimary: false,
      wallet: readWallet(new FormData(event.currentTarget)),
    })
  }

  function onSame(checked: boolean) {
    setError('')
    setMessage('')
    if (!checked) setSecondaryOpen(false)
    saveSecondary.mutate({ sameAsPrimary: checked, wallet: null })
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Carteira principal</h2>
          <p className="mt-1 text-sm text-sand">
            Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
          </p>
        </div>
        <button
          type="button"
          className="text-sm text-ember"
          onClick={() => {
            setFresh(true)
            setDraft((value) => value + 1)
            setMessage('')
            setError('')
          }}
        >
          Adicionar
        </button>
      </div>

      <form key={fresh ? `nova-${draft}` : (primary?.address ?? 'vazia')} className="mt-4" onSubmit={onPrimary}>
        <WalletFields wallet={primary} />
        <Button type="submit" className="mt-6" disabled={savePrimary.isPending}>
          Salvar carteira
        </Button>
      </form>

      <div className="mt-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Carteira secundária</h2>
          {!data.sameAsPrimary && !data.secondary ? (
            <p className="mt-1 text-sm text-sand">
              Você ainda não adicionou uma carteira secundária.
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={data.sameAsPrimary}
              className="size-4 appearance-none rounded-full border border-sand checked:border-ember checked:bg-ember"
              onChange={(event) => onSame(event.target.checked)}
            />
            Igual à carteira principal
          </label>
          <button
            type="button"
            className="text-ember"
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

      {showSecondaryForm ? (
        <form
          key={data.secondary?.address ?? 'secundaria'}
          className="mt-4"
          onSubmit={onSecondary}
        >
          <WalletFields wallet={data.secondary} />
          <Button type="submit" className="mt-6" disabled={saveSecondary.isPending}>
            Salvar carteira
          </Button>
        </form>
      ) : null}

      {error ? (
        <p className="mt-4 text-sm text-ember" role="alert">
          {error}
        </p>
      ) : null}
      {message ? <p className="mt-4 text-sm text-sand">{message}</p> : null}
    </div>
  )
}

function readWallet(data: FormData): CollectorWallet {
  return {
    displayName: String(data.get('displayName') ?? ''),
    walletNickname: String(data.get('walletNickname') ?? ''),
    network: String(data.get('network') ?? ''),
    profileName: String(data.get('profileName') ?? ''),
    address: String(data.get('address') ?? ''),
    secondaryEns: String(data.get('secondaryEns') ?? ''),
    walletType: String(data.get('walletType') ?? ''),
    referralCode: String(data.get('referralCode') ?? ''),
    email: String(data.get('email') ?? ''),
    ensName: String(data.get('ensName') ?? ''),
    ensSuffix: String(data.get('ensSuffix') ?? '.eth'),
  }
}

function WalletFields({ wallet }: { wallet: CollectorWallet | null }) {
  return (
    <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      <TextField label="Nome de exibição" name="displayName" required defaultValue={wallet?.displayName} />
      <TextField
        label="Apelido da carteira"
        name="walletNickname"
        required
        defaultValue={wallet?.walletNickname}
      />
      <SelectField
        label="Rede"
        name="network"
        required
        placeholder="Selecione uma rede"
        defaultValue={wallet?.network}
        options={networks.map((item) => item.label)}
      />
      <TextField label="Nome do perfil" name="profileName" required defaultValue={wallet?.profileName} />
      <TextField
        label="Endereço da carteira"
        name="address"
        required
        placeholder="Endereço 0x da carteira"
        defaultValue={wallet?.address}
      />
      <TextField
        label="ENS ou carteira secundária (opcional)"
        name="secondaryEns"
        defaultValue={wallet?.secondaryEns}
      />
      <SelectField
        label="Tipo de carteira"
        name="walletType"
        required
        placeholder="Selecione uma carteira"
        defaultValue={wallet?.walletType}
        options={walletTypes}
      />
      <TextField
        label="Código de indicação"
        name="referralCode"
        required
        defaultValue={wallet?.referralCode}
      />
      <TextField label="E-mail" name="email" type="email" required defaultValue={wallet?.email} />
      <label className="block text-sm">
        Nome ENS <span className="text-ember">*</span>
        <span className="mt-2 flex">
          <span className="relative">
            <select
              name="ensSuffix"
              defaultValue={wallet?.ensSuffix || '.eth'}
              aria-label="Sufixo ENS"
              className="h-11 appearance-none rounded-l-lg border border-[#8a5a38] bg-transparent pr-7 pl-3 text-sm outline-none"
            >
              <option value=".eth">.eth</option>
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-sand"
            />
          </span>
          <input
            name="ensName"
            required
            defaultValue={wallet?.ensName}
            aria-label="Nome ENS"
            className={`${fieldClass} rounded-l-none`}
          />
        </span>
      </label>
    </div>
  )
}

function TextField({
  label,
  name,
  defaultValue,
  required,
  placeholder,
  type = 'text',
}: {
  label: string
  name: string
  defaultValue?: string
  required?: boolean
  placeholder?: string
  type?: string
}) {
  return (
    <label className="block text-sm">
      {label}
      {required ? <span className="text-ember"> *</span> : null}
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className={`${fieldClass} mt-2`}
      />
    </label>
  )
}

function SelectField({
  label,
  name,
  required,
  placeholder,
  options,
  defaultValue = '',
}: {
  label: string
  name: string
  required?: boolean
  placeholder: string
  options: string[]
  defaultValue?: string
}) {
  const [value, setValue] = useState(defaultValue)
  return (
    <label className="block text-sm">
      {label}
      {required ? <span className="text-ember"> *</span> : null}
      <span className="relative mt-2 block">
        <select
          name={name}
          required={required}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className={cn(fieldClass, 'appearance-none pr-8', value ? 'text-white' : 'text-sand')}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sand"
        />
      </span>
    </label>
  )
}
