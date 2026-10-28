import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { ChevronDown } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type { SessionUser } from '../../types/auth'
import type { CartQuote } from '../../types/cart'
import { networks } from '../../types/nft'
import type { CollectorWallet } from '../../types/wallet'

const mono = { fontFamily: "'Roboto Mono', ui-monospace, monospace" } as const

// A API aceita "compativeis" para WalletConnect. MetaMask e Coinbase têm id próprio.
const providers = [
  { id: 'compativeis', label: 'WalletConnect', mark: 'W' },
  { id: 'metamask', label: 'MetaMask', mark: 'M' },
  { id: 'coinbase', label: 'Coinbase Wallet', mark: 'wallet' },
] as const

const walletTypes = ['MetaMask', 'WalletConnect', 'Coinbase Wallet']

const fieldClass =
  'h-12 w-full rounded-2xl border border-[#3F2319] bg-[#241814] px-4 text-sm text-white outline-none placeholder:text-[#C9A27A]'

export type SavedAccount = {
  id: 'primary' | 'secondary'
  wallet: CollectorWallet
}

export type MobileCheckoutFields = {
  displayName: string
  username: string
  network: string
  profileName: string
  walletAddress: string
  secondaryWallet: string
  walletType: string
  referralCode: string
  email: string
  ensName: string
  ensSuffix: string
  useAnotherWallet: boolean
  note: string
}

export function MobilePayment({
  loading,
  error,
  empty,
  quote,
  accounts,
  profile,
  accountId,
  providerId,
  link,
  message,
  stale,
  pending,
  onRetry,
  onAccount,
  onProvider,
  onConnect,
  onSwitch,
  onUseOther,
  onConfirm,
}: {
  loading: boolean
  error: boolean
  empty: boolean
  quote?: CartQuote
  accounts: SavedAccount[]
  profile: SessionUser | null
  accountId: 'primary' | 'secondary'
  providerId: string
  link: 'off' | 'on' | 'refused'
  message: string
  stale: boolean
  pending: boolean
  onRetry: () => void
  onAccount: (id: 'primary' | 'secondary') => void
  onProvider: (id: string) => void
  onConnect: () => void
  onSwitch: () => void
  onUseOther: () => void
  onConfirm: (fields?: MobileCheckoutFields) => void
}) {
  const router = useRouter()
  const navigate = useNavigate()
  const [useOther, setUseOther] = useState(false)
  const connected = link === 'on'
  const status =
    link === 'on'
      ? 'Carteira conectada'
      : link === 'refused'
        ? 'Conexão recusada'
        : 'Carteira desconectada'

  function goBack() {
    if (window.history.length > 1) {
      router.history.back()
      return
    }
    navigate({ to: '/carrinho' })
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    onConfirm({
      displayName: String(data.get('displayName') ?? ''),
      username: String(data.get('username') ?? ''),
      network: String(data.get('network') ?? ''),
      profileName: String(data.get('profileName') ?? ''),
      walletAddress: String(data.get('walletAddress') ?? ''),
      secondaryWallet: String(data.get('secondaryWallet') ?? ''),
      walletType: String(data.get('walletType') ?? ''),
      referralCode: String(data.get('referralCode') ?? ''),
      email: String(data.get('email') ?? ''),
      ensName: String(data.get('ensName') ?? ''),
      ensSuffix: String(data.get('ensSuffix') ?? '.eth'),
      useAnotherWallet: data.get('useAnotherWallet') === 'on',
      note: String(data.get('note') ?? ''),
    })
  }

  const chosen = accounts.find((item) => item.id === accountId)?.wallet
  const other = accounts.find((item) => item.id !== accountId)?.wallet

  return (
    <div className="bg-black md:hidden">
      <div
        className="mx-auto flex h-svh max-w-[414px] flex-col overflow-hidden rounded-[40px] bg-[#140D0A] pt-8 text-white"
        style={mono}
      >
        <header className="relative flex h-11 shrink-0 items-center px-7">
          <button type="button" className="shrink-0" aria-label="Voltar" onClick={goBack}>
            <BackIcon />
          </button>
          <h1 className="pointer-events-none absolute inset-x-0 text-center text-base font-bold">
            Pagamento com carteira
          </h1>
        </header>

        {loading ? (
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-7 pt-6">
            <div className="skeleton h-16 rounded-2xl" />
            <div className="skeleton h-16 rounded-2xl" />
            <div className="skeleton h-14 rounded-2xl" />
            <div className="skeleton h-14 rounded-2xl" />
            <div className="skeleton h-14 rounded-2xl" />
          </div>
        ) : null}

        {error ? (
          <div className="px-7 pt-8" role="alert">
            <p>Não foi possível carregar o pagamento.</p>
            <button type="button" className="mt-4 text-sm font-bold text-[#E89B55]" onClick={onRetry}>
              Tentar de novo
            </button>
          </div>
        ) : null}

        {empty ? (
          <div className="px-7 pt-8">
            <p className="text-base font-bold">Seu carrinho está vazio</p>
            <Link to="/carrinho" className="mt-4 inline-block text-sm font-bold text-[#E89B55]">
              Voltar ao carrinho
            </Link>
          </div>
        ) : null}

        {!loading && !error && !empty && quote ? (
          <form className="flex min-h-0 flex-1 flex-col" onSubmit={submit}>
            <div className="min-h-0 flex-1 overflow-y-auto px-7 pt-6 pb-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <p>{status}</p>
                <button
                  type="button"
                  className="font-bold text-[#E89B55]"
                  onClick={connected ? onSwitch : onConnect}
                >
                  {connected ? 'Trocar carteira' : 'Conectar'}
                </button>
              </div>

              {accounts.length > 0 ? (
                <div className="mt-4 space-y-3" role="radiogroup" aria-label="Carteira conectada">
                  {accounts.map((account) => (
                    <button
                      key={account.id}
                      type="button"
                      role="radio"
                      aria-checked={accountId === account.id}
                      className="flex w-full items-center gap-3 rounded-2xl border border-[#3F2319] bg-[#241814] px-4 py-3 text-left"
                      onClick={() => onAccount(account.id)}
                    >
                      <RadioMark checked={accountId === account.id} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold">{accountTitle(account.wallet)}</span>
                        <span className="mt-0.5 block truncate text-sm text-[#C9A27A]">
                          {accountLine(account.wallet)}
                        </span>
                        <span className="block text-sm text-[#C9A27A]">
                          Rede {account.wallet.network}
                        </span>
                      </span>
                      <Dots />
                    </button>
                  ))}
                </div>
              ) : null}

              <div key={`${accountId}-${useOther ? 'outra' : 'salva'}`} className="mt-6 space-y-4">
                <h2 className="text-sm font-bold">Perfil do colecionador</h2>
                <Field
                  label="Nome de exibição"
                  name="displayName"
                  required
                  defaultValue={chosen?.displayName || profile?.displayName}
                />
                <Field label="Nome de usuário" name="username" required defaultValue={profile?.username} />
                <SelectField
                  label="Rede"
                  name="network"
                  required
                  placeholder="Selecione uma rede"
                  defaultValue={chosen?.network ?? ''}
                  options={networks.map((item) => item.label)}
                />
                <Field label="Nome do perfil" name="profileName" required defaultValue={chosen?.profileName} />
                <Field
                  label="Endereço da carteira"
                  name="walletAddress"
                  required
                  placeholder="Endereço 0x da carteira"
                  defaultValue={useOther ? '' : chosen?.address}
                />
                <Field
                  label="ENS ou carteira secundária (opcional)"
                  name="secondaryWallet"
                  defaultValue={useOther ? '' : other?.address || chosen?.secondaryEns}
                />
                <SelectField
                  label="Tipo de carteira"
                  name="walletType"
                  required
                  placeholder="Selecione uma carteira"
                  defaultValue={chosen?.walletType ?? ''}
                  options={walletTypes}
                />
                <Field label="Código de indicação" name="referralCode" required defaultValue={chosen?.referralCode} />
                <Field
                  label="E-mail"
                  name="email"
                  type="email"
                  required
                  defaultValue={chosen?.email || profile?.email}
                />
                <EnsField
                  ensName={chosen?.ensName || profile?.ensName || ''}
                  ensSuffix={chosen?.ensSuffix || profile?.ensSuffix || '.eth'}
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="useAnotherWallet"
                    checked={useOther}
                    className="size-4 appearance-none rounded-full border border-[#E89B55] checked:bg-[#E89B55]"
                    onChange={(event) => {
                      setUseOther(event.target.checked)
                      if (event.target.checked) onUseOther()
                    }}
                  />
                  Usar outra carteira?
                </label>
                <label className="block text-sm">
                  Observação do colecionador (opcional)
                  <textarea name="note" rows={4} className={`${fieldClass} mt-2 h-auto py-3`} />
                </label>
              </div>

              <h2 className="mt-6 text-sm font-bold">Carteira e rede</h2>
              <div className="mt-3 space-y-3" role="radiogroup" aria-label="Carteira e rede">
                {providers.map((provider) => (
                  <button
                    key={provider.id}
                    type="button"
                    role="radio"
                    aria-checked={providerId === provider.id}
                    className="flex w-full items-center gap-3 rounded-2xl border border-[#3F2319] bg-[#241814] px-4 py-3 text-left"
                    onClick={() => onProvider(provider.id)}
                  >
                    <ProviderMark mark={provider.mark} />
                    <span className="min-w-0 flex-1 text-sm font-bold">{provider.label}</span>
                    <RadioMark checked={providerId === provider.id} />
                  </button>
                ))}
              </div>

              {stale ? (
                <p className="mt-4 text-sm text-[#E89B55]" role="status">
                  O preço mudou. Revise o resumo antes de confirmar.
                </p>
              ) : null}
              {message ? (
                <p className="mt-4 text-sm text-[#E89B55]" role="alert">
                  {message}
                </p>
              ) : null}
            </div>

            <footer className="shrink-0 px-7 pt-2 pb-8">
              <p className="flex items-center justify-end gap-3 text-base font-bold">
                <span>Total:</span>
                <span className="text-[#E89B55]">{quote.totalEth} ETH</span>
              </p>
              <button
                type="submit"
                className="mx-auto mt-8 flex h-[60px] w-[320px] shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#E3A15C] to-[#C47B3C] text-sm font-bold text-[#1A100C] disabled:opacity-50"
                disabled={pending || stale}
              >
                Confirmar compra
              </button>
            </footer>
          </form>
        ) : null}
      </div>
    </div>
  )
}

function Field({
  label,
  name,
  required,
  placeholder,
  type = 'text',
  defaultValue,
}: {
  label: string
  name: string
  required?: boolean
  placeholder?: string
  type?: string
  defaultValue?: string
}) {
  return (
    <label className="block text-sm">
      <span>
        {label}
        {required ? <span className="text-[#E89B55]"> *</span> : null}
      </span>
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
  defaultValue = '',
  options,
}: {
  label: string
  name: string
  required?: boolean
  placeholder: string
  defaultValue?: string
  options: readonly string[]
}) {
  return (
    <label className="block text-sm">
      <span>
        {label}
        {required ? <span className="text-[#E89B55]"> *</span> : null}
      </span>
      <span className="relative mt-2 block">
        <select
          name={name}
          required={required}
          defaultValue={defaultValue}
          className={`${fieldClass} appearance-none bg-none pr-10`}
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
          className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[#C9A27A]"
        />
      </span>
    </label>
  )
}

function EnsField({ ensName, ensSuffix }: { ensName: string; ensSuffix: string }) {
  return (
    <label className="block text-sm">
      <span>
        Nome ENS <span className="text-[#E89B55]">*</span>
      </span>
      <span className="mt-2 flex">
        <input
          name="ensName"
          required
          defaultValue={ensName}
          className={`${fieldClass} rounded-r-none`}
        />
        <span className="relative">
          <select
            name="ensSuffix"
            defaultValue={ensSuffix}
            aria-label="Sufixo ENS"
            className="h-12 appearance-none rounded-r-2xl border border-l-0 border-[#3F2319] bg-[#241814] pr-8 pl-3 text-sm text-white outline-none"
          >
            <option value=".eth">.eth</option>
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[#C9A27A]"
          />
        </span>
      </span>
    </label>
  )
}

function accountTitle(wallet: CollectorWallet) {
  return wallet.walletNickname || wallet.displayName || accountLine(wallet)
}

function accountLine(wallet: CollectorWallet) {
  if (wallet.ensName) return `${wallet.ensName}${wallet.ensSuffix || '.eth'}`
  return shortAddress(wallet.address)
}

function shortAddress(value: string) {
  if (value.length <= 12) return value
  return `${value.slice(0, 6)}...${value.slice(-4)}`
}

function RadioMark({ checked }: { checked: boolean }) {
  return (
    <span
      className={
        checked
          ? 'grid size-5 shrink-0 place-items-center rounded-full border-2 border-[#E89B55]'
          : 'size-5 shrink-0 rounded-full border-2 border-[#6b5346]'
      }
      aria-hidden="true"
    >
      {checked ? <span className="size-2.5 rounded-full bg-[#E89B55]" /> : null}
    </span>
  )
}

function ProviderMark({ mark }: { mark: 'W' | 'M' | 'wallet' }) {
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-full border border-[#3F2319] bg-[#2F1D15] text-sm font-bold text-[#E89B55]">
      {mark === 'wallet' ? <WalletGlyph /> : mark}
    </span>
  )
}

function WalletGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.5" y="3.5" width="13" height="9" rx="2" stroke="#E89B55" />
      <path d="M1.5 6.5h13" stroke="#E89B55" />
      <circle cx="11.5" cy="9.5" r="0.8" fill="#E89B55" />
    </svg>
  )
}

function Dots() {
  return (
    <svg width="16" height="4" viewBox="0 0 16 4" fill="#C9A27A" aria-hidden="true">
      <circle cx="2" cy="2" r="1.4" />
      <circle cx="8" cy="2" r="1.4" />
      <circle cx="14" cy="2" r="1.4" />
    </svg>
  )
}

function BackIcon() {
  return (
    <svg
      width="35"
      height="35"
      viewBox="0 0 35 35"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M34.5 17.5C34.5 26.8888 26.8888 34.5 17.5 34.5C8.11116 34.5 0.5 26.8888 0.5 17.5C0.5 8.11116 8.11116 0.5 17.5 0.5C26.8888 0.5 34.5 8.11116 34.5 17.5Z"
        fill="#2F1D15"
        stroke="#3F2319"
      />
      <path
        d="M19.9166 22.8332C19.9166 22.8332 14.0833 19.3798 14.0833 16.9998C14.0833 14.6207 19.9166 11.1665 19.9166 11.1665"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="#B39463"
      />
    </svg>
  )
}
