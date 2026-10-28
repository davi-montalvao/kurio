import type { FormEvent } from 'react'
import { FormField, SelectField } from '../form/form-field'
import { ChevronDownIcon } from '../icons/AccountIcons'
import { networks } from '../../types/nft'
import type { CollectorWallet } from '../../types/wallet'

const walletTypes = ['MetaMask', 'WalletConnect', 'Coinbase Wallet']

export function readWallet(data: FormData): CollectorWallet {
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

export function walletClientErrors(wallet: CollectorWallet) {
  const fields: Record<string, string> = {}
  const required: Array<keyof CollectorWallet> = [
    'displayName',
    'walletNickname',
    'network',
    'profileName',
    'address',
    'walletType',
    'referralCode',
    'email',
    'ensName',
  ]
  for (const key of required) {
    if (!String(wallet[key] ?? '').trim()) fields[key] = 'Campo obrigatório.'
  }
  if (wallet.address.trim() && !/^0x[a-fA-F0-9]{40}$/.test(wallet.address.trim())) {
    fields.address = 'Informe um endereço 0x com 42 caracteres.'
  }
  if (wallet.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(wallet.email.trim())) {
    fields.email = 'Informe um e-mail válido.'
  }
  return fields
}

export function WalletForm({
  wallet,
  errors,
  onSubmit,
  pending,
}: {
  wallet: CollectorWallet | null
  errors: Record<string, string>
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  pending: boolean
}) {
  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <FormField density="wallet" label="Nome de exibição" name="displayName" required defaultValue={wallet?.displayName} error={errors.displayName} inputClassName="px-[13px]" />
        <FormField density="wallet" label="Apelido da carteira" name="walletNickname" required defaultValue={wallet?.walletNickname} error={errors.walletNickname} inputClassName="px-[13px]" />
        <SelectField density="wallet" label="Rede" name="network" required placeholder="Selecione uma rede" defaultValue={wallet?.network} options={networks.map((item) => item.label)} error={errors.network} />
        <FormField density="wallet" label="Nome do perfil" name="profileName" required defaultValue={wallet?.profileName} error={errors.profileName} inputClassName="px-[13px]" />
        <FormField density="wallet" label="Endereço da carteira" name="address" required placeholder="Endereço 0x da carteira" defaultValue={wallet?.address} error={errors.address} inputClassName="px-[13px]" />
        <FormField density="wallet" label="ENS ou carteira secundária (opcional)" name="secondaryEns" hideLabel className="md:h-[69px]" defaultValue={wallet?.secondaryEns} inputClassName="px-[13px]" />
        <SelectField density="wallet" label="Tipo de carteira" name="walletType" required placeholder="Selecione uma carteira" defaultValue={wallet?.walletType} options={walletTypes} error={errors.walletType} />
        <FormField density="wallet" label="Código de indicação" name="referralCode" required defaultValue={wallet?.referralCode} error={errors.referralCode} inputClassName="px-[13px]" />
        <FormField density="wallet" label="E-mail" name="email" type="email" required defaultValue={wallet?.email} error={errors.email} inputClassName="px-[13px]" />
        <WalletEns ensName={wallet?.ensName ?? ''} ensSuffix={wallet?.ensSuffix || '.eth'} error={errors.ensName} />
      </div>
      <button
        type="submit"
        className="h-10 min-w-[131px] self-start rounded-[3px] bg-kprimary px-4 text-sm font-bold text-kbg disabled:opacity-50"
        disabled={pending}
      >
        Salvar carteira
      </button>
    </form>
  )
}

function WalletEns({ ensName, ensSuffix, error }: { ensName: string; ensSuffix: string; error?: string }) {
  return (
    <div className="flex flex-col">
      <label htmlFor="wallet-ens" className="flex h-[29px] items-center gap-1 text-[15px] leading-[15px]">
        Nome ENS
        <span className="text-[22px] leading-[29px] text-krequired">*</span>
      </label>
      <span className="-mt-1 flex gap-2.5">
        <span className="relative shrink-0">
          <select
            name="ensSuffix"
            defaultValue={ensSuffix}
            aria-label="Sufixo ENS"
            className="h-10 w-[104px] appearance-none rounded-[3px] border border-kborder bg-transparent pr-8 pl-3 text-[15px] text-ktext outline-none"
          >
            <option value=".eth">.eth</option>
          </select>
          <ChevronDownIcon size={20} aria-hidden="true" className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-ktext" />
        </span>
        <input
          id="wallet-ens"
          name="ensName"
          defaultValue={ensName}
          className="h-10 w-full max-w-[329px] rounded-[3px] border border-kborder bg-transparent px-[13px] text-sm outline-none focus:border-kprimary"
        />
      </span>
      {error ? <p className="mt-1 text-xs text-krequired">{error}</p> : null}
    </div>
  )
}
