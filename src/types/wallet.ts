export type CollectorWallet = {
  displayName: string
  walletNickname: string
  network: string
  profileName: string
  address: string
  secondaryEns: string
  walletType: string
  referralCode: string
  email: string
  ensName: string
  ensSuffix: string
}

export type UserWallets = {
  primary: CollectorWallet | null
  secondary: CollectorWallet | null
  sameAsPrimary: boolean
}
