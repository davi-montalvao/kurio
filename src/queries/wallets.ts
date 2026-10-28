import { queryOptions } from '@tanstack/react-query'
import { userWalletsSchema } from '../contracts/wallet'
import { api } from '../lib/api'

export function walletsQueryOptions() {
  return queryOptions({
    queryKey: ['wallets'],
    queryFn: async ({ signal }) => {
      const response = await api.get('/wallets', { signal })
      return userWalletsSchema.parse(response.data)
    },
  })
}
