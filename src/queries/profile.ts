import { queryOptions } from '@tanstack/react-query'
import { profileResponseSchema } from '../contracts/profile'
import { api } from '../lib/api'

export function profileQueryOptions() {
  return queryOptions({
    queryKey: ['session'],
    queryFn: async ({ signal }) => {
      const response = await api.get('/profile', { signal })
      return profileResponseSchema.parse(response.data).user
    },
  })
}
