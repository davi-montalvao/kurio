import { queryOptions } from '@tanstack/react-query'
import { homeContentSchema } from '../contracts/content'
import { api } from '../lib/api'

export function contentQueryOptions() {
  return queryOptions({
    queryKey: ['content'],
    queryFn: async ({ signal }) => {
      const response = await api.get('/content', { signal })
      return homeContentSchema.parse(response.data)
    },
  })
}
