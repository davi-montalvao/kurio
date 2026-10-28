import { z } from 'zod'

export const collectorWalletSchema = z.object({
  displayName: z.string(),
  walletNickname: z.string(),
  network: z.string(),
  profileName: z.string(),
  address: z.string(),
  secondaryEns: z.string(),
  walletType: z.string(),
  referralCode: z.string(),
  email: z.string(),
  ensName: z.string(),
  ensSuffix: z.string(),
})

export const userWalletsSchema = z.object({
  primary: collectorWalletSchema.nullable(),
  secondary: collectorWalletSchema.nullable(),
  sameAsPrimary: z.boolean(),
})

export type UserWalletsResponse = z.infer<typeof userWalletsSchema>
