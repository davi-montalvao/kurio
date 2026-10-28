import { queryOptions } from '@tanstack/react-query'
import { cartResponseSchema } from '../contracts/cart'
import { api } from '../lib/api'

export function cartQueryOptions() {
  return queryOptions({
    queryKey: ['cart'],
    queryFn: async ({ signal }) => {
      const response = await api.get('/cart', { signal })
      return cartResponseSchema.parse(response.data)
    },
  })
}
