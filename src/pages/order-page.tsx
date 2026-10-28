import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'
import { SiteHeader } from '../components/site-header'
import { api } from '../lib/api'
import { useRequireSession } from '../lib/require-session'
import { OrderConfirmationModal, OrderRouteFallback } from '../components/order/order-confirmation-modal'
import type { OrderResponse } from '../types/order'

export function OrderPage() {
  const navigate = useNavigate()
  const session = useRequireSession()
  const { orderId } = useParams({ strict: false })
  const order = useQuery({
    queryKey: ['order', orderId],
    enabled: Boolean(orderId) && Boolean(session.data),
    queryFn: async ({ signal }) => {
      const response = await api.get<OrderResponse>(`/orders/${orderId}`, { signal })
      return response.data
    },
  })

  function close() {
    void navigate({ to: '/' })
  }

  if (session.isPending || !session.data) {
    return (
      <div className="hidden min-h-svh bg-kbg md:block">
        <SiteHeader />
      </div>
    )
  }

  if (order.isPending) {
    return (
      <main className="grid min-h-svh place-items-center bg-kbg">
        <div className="skeleton h-[640px] w-full max-w-[578px]" />
      </main>
    )
  }

  if (order.isError || !order.data) {
    return <OrderRouteFallback missing />
  }

  if (order.data.status === 'pending') {
    return <OrderRouteFallback pending />
  }

  if (order.data.status === 'refused') {
    return <OrderRouteFallback refused />
  }

  return (
    <div className="min-h-svh bg-kbg">
      <OrderConfirmationModal order={order.data} onClose={close} />
    </div>
  )
}
