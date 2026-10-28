import { z } from 'zod'

export const sessionUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  username: z.string(),
  displayName: z.string(),
  ensName: z.string(),
  ensSuffix: z.string(),
  walletNickname: z.string(),
  avatar: z.string().nullable(),
})

export const profileResponseSchema = z.object({
  user: sessionUserSchema.nullable(),
})

export type ProfileResponse = z.infer<typeof profileResponseSchema>
