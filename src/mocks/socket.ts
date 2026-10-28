import { ws } from 'msw'
import { addEth } from '../lib/eth'
import { getNftDetail } from './nft-detail'
import {
  findOrder,
  listPendingOrders,
  readCart,
  replaceOrder,
  saveNftUpdate,
} from './store'
import type { OrderStatus } from '../types/order'

type SocketClient = {
  send: (data: string) => void
  addEventListener: (
    type: 'message' | 'close',
    listener: (event: { data?: unknown }) => void,
  ) => void
}

const clients = new Set<SocketClient>()
let priceTimer = 0

function broadcast(name: string, payload: unknown) {
  const frame = `42${JSON.stringify([name, payload])}`
  for (const client of clients) client.send(frame)
}

export function publishPrice(nftId: string) {
  const nft = getNftDetail(nftId)
  if (!nft) return
  const priceEth = addEth(nft.priceEth, '0.10', 2)
  const version = saveNftUpdate(nftId, priceEth, true)
  broadcast('nft.updated', {
    id: crypto.randomUUID(),
    version,
    nftId,
    name: nft.name,
    priceEth,
    available: true,
  })
}

export function finishOrder(id: string, status: Exclude<OrderStatus, 'pending'>) {
  const current = findOrder(id)
  if (!current || current.status === 'confirmed' || current.status === 'refused') return
  replaceOrder({ ...current, status }, status === 'confirmed')
  broadcast('order.updated', {
    id: crypto.randomUUID(),
    version: 1,
    orderId: id,
    status,
    userId: current.userId ?? null,
  })
}

function watchPrice() {
  if (sessionStorage.getItem('kurio-nft-bump')) return
  const line = readCart()[0]
  if (!line) return
  sessionStorage.setItem('kurio-nft-bump', '1')
  publishPrice(line.nftId)
}

function ensurePriceWatch() {
  if (priceTimer) return
  priceTimer = window.setInterval(watchPrice, 4000)
}

const socketUrl =
  typeof location === 'undefined'
    ? 'ws://localhost:5173'
    : `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}`

export const socketHandlers = [
  ws.link(socketUrl).addEventListener('connection', ({ client }) => {
    const socket = client as SocketClient
    clients.add(socket)
    socket.addEventListener('message', (event) => {
      const data = typeof event.data === 'string' ? event.data : ''
      if (data === '2') socket.send('3')
      if (data.startsWith('40')) {
        socket.send(`40${JSON.stringify({ sid: crypto.randomUUID() })}`)
        ensurePriceWatch()
      }
    })
    socket.send(
      `0${JSON.stringify({
        sid: crypto.randomUUID(),
        upgrades: [],
        pingInterval: 25000,
        pingTimeout: 20000,
        maxPayload: 1000000,
      })}`,
    )
    for (const order of listPendingOrders()) {
      if (order.status === 'pending') finishOrder(order.id, order.nextStatus ?? 'confirmed')
    }

    socket.addEventListener('close', () => {
      clients.delete(socket)
      if (clients.size === 0 && priceTimer) {
        window.clearInterval(priceTimer)
        priceTimer = 0
      }
    })
  }),
]
