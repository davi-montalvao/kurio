import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from './api'
import type { SessionUser } from '../types/auth'
import type { NftListResponse, NftSummary } from '../types/nft'
import type { OrderResponse, OrderStatus } from '../types/order'

type NftUpdated = {
  id: string
  version: number
  nftId: string
  name: string
  priceEth: string
  available: boolean
}

type OrderUpdated = {
  id: string
  version: number
  orderId: string
  status: Exclude<OrderStatus, 'pending'>
  userId: string | null
}

type LiveValue = {
  notice: string | null
  stale: boolean
  acknowledge: () => void
}

const LiveContext = createContext<LiveValue>({
  notice: null,
  stale: false,
  acknowledge: () => {},
})

export function useLive() {
  return useContext(LiveContext)
}

export function PriceNotice({ className = '' }: { className?: string }) {
  const { notice, stale, acknowledge } = useLive()
  if (!notice) return null

  return (
    <div
      className={`flex items-center justify-between gap-3 border border-[#A66D3E] bg-surface-card px-4 py-3 text-sm text-[#F5F1EB] ${className}`}
      role="status"
    >
      <p>{notice}</p>
      {stale ? (
        <button
          type="button"
          className="shrink-0 font-semibold text-[#E89B55]"
          onClick={acknowledge}
        >
          Revisar resumo
        </button>
      ) : null}
    </div>
  )
}

const versions = new Map<string, number>()

function newer(key: string, version: number) {
  const current = versions.get(key) ?? 0
  if (version <= current) return false
  versions.set(key, version)
  return true
}

export function Realtime({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const session = useQuery({
    queryKey: ['session'],
    queryFn: async ({ signal }) => {
      const response = await api.get<{ user: SessionUser | null }>('/session', { signal })
      return response.data.user
    },
  })
  const [notice, setNotice] = useState<string | null>(null)
  const [stale, setStale] = useState(false)
  const userId = session.data?.id ?? null

  useEffect(() => {
    if (session.isPending) return
    let disposed = false
    let disconnect = () => {}

    void import('socket.io-client').then(({ io }) => {
      if (disposed) return
      const socket = io(window.location.origin, {
        transports: ['websocket'],
        reconnection: true,
        forceNew: true,
        auth: { userId },
      })

      const reconcile = () => {
        void queryClient.invalidateQueries({ queryKey: ['nfts'] })
        void queryClient.invalidateQueries({ queryKey: ['nft'] })
        void queryClient.invalidateQueries({ queryKey: ['cart'] })
        void queryClient.invalidateQueries({ queryKey: ['order'] })
      }

      socket.on('connect', reconcile)
      socket.on('nft.updated', (event: NftUpdated) => {
        if (!newer(`nft:${event.nftId}`, event.version)) return
        queryClient.setQueriesData<NftListResponse>({ queryKey: ['nfts'] }, (current) => {
          if (!current?.items) return current
          const map = (nft: NftSummary) =>
            nft.id === event.nftId ? { ...nft, priceEth: event.priceEth } : nft
          return {
            ...current,
            items: current.items.map(map),
            featured: current.featured ? map(current.featured) : current.featured,
          }
        })
        void queryClient.invalidateQueries({ queryKey: ['nfts'] })
        void queryClient.invalidateQueries({ queryKey: ['nft', event.nftId] })
        void queryClient.invalidateQueries({ queryKey: ['cart'] })
        setNotice(`O preço de ${event.name} mudou para ${event.priceEth} ETH.`)
        setStale(true)
      })
      socket.on('order.updated', (event: OrderUpdated) => {
        if (event.userId !== userId) return
        if (!newer(`order:${event.orderId}`, event.version)) return
        queryClient.setQueryData<OrderResponse>(['order', event.orderId], (current) =>
          current ? { ...current, status: event.status } : current,
        )
        void queryClient.invalidateQueries({ queryKey: ['order', event.orderId] })
        void queryClient.invalidateQueries({ queryKey: ['cart'] })
      })

      disconnect = () => {
        socket.off()
        socket.disconnect()
      }
    })

    return () => {
      disposed = true
      disconnect()
    }
  }, [queryClient, session.isPending, userId])

  return (
    <LiveContext.Provider
      value={{
        notice,
        stale,
        acknowledge: () => setStale(false),
      }}
    >
      <PriceNotice className="fixed top-4 left-1/2 z-50 w-[min(440px,92vw)] -translate-x-1/2 md:hidden" />
      {children}
    </LiveContext.Provider>
  )
}
