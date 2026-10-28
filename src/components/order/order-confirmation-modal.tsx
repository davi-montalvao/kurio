import { Link } from '@tanstack/react-router'
import { useEffect, useId, useRef } from 'react'
import type { CartItem } from '../../types/cart'
import type { OrderResponse } from '../../types/order'
import { cn } from '../../lib/cn'
import { CloseIcon } from '../icons/AccountIcons'

const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function formatDate(value: string) {
  const date = new Date(value)
  return `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`
}

function money(value: string) {
  return `${value} ETH`
}

type OrderConfirmationModalProps = {
  order: OrderResponse
  onClose: () => void
}

export function OrderConfirmationModal({ order, onClose }: OrderConfirmationModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  const onCloseRef = useRef(onClose)
  const skipClose = useRef(false)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const notify = () => {
      if (skipClose.current) {
        skipClose.current = false
        return
      }
      onCloseRef.current()
    }
    dialog.addEventListener('close', notify)
    dialog.showModal()
    return () => {
      skipClose.current = true
      dialog.removeEventListener('close', notify)
      if (dialog.open) dialog.close()
    }
  }, [])

  const facts = [
    ['ID da transação', order.txId],
    ['Data', formatDate(order.createdAt)],
    ['Total', money(order.quote.totalEth)],
    ['Carteira', order.walletLabel],
  ]

  return (
    <dialog
      ref={dialogRef}
      aria-modal="true"
      aria-labelledby={titleId}
      className="order-receipt m-auto h-fit max-h-[calc(100vh-48px)] w-[min(578px,calc(100vw-32px))] overflow-hidden rounded-xl bg-ksurface p-0 font-mono text-ktext max-md:m-0 max-md:h-full max-md:max-h-none max-md:w-full max-md:rounded-none"
    >
      <article className="relative flex max-h-[calc(100vh-48px)] flex-col overflow-y-auto max-md:h-full max-md:max-h-none">
        <button
          type="button"
          aria-label="Fechar"
          className="absolute top-[17px] right-[14px] text-kprimary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kprimary"
          onClick={onClose}
        >
          <CloseIcon size={18} />
        </button>

        <header className="flex h-[156px] shrink-0 flex-col items-center justify-center gap-4 px-6 text-center">
          <ThankYouMark />
          <h1 id={titleId} className="text-base leading-4 font-bold text-kmuted">
            Seus NFTs agora estão na sua carteira
          </h1>
        </header>

        <div className="h-px bg-kprimary" />

        <dl className="grid grid-cols-2 gap-4 px-6 py-4 md:flex md:items-center md:justify-between md:px-9 md:py-1">
          {facts.map(([label, value], index) => (
            <div key={label} className="flex min-w-0 items-center gap-4">
              {index > 0 ? <span className="hidden h-[31px] w-px bg-kprimary md:block" /> : null}
              <div className="min-w-0">
                <dt className="text-sm leading-4 font-bold text-kmuted">{label}</dt>
                <dd className="mt-1 text-[15px] leading-4 font-normal break-words text-kmuted">{value}</dd>
              </div>
            </div>
          ))}
        </dl>

        <div className="h-px bg-kprimary" />

        <div className="flex flex-col gap-3 px-6 pt-5 pb-12 md:px-11">
          <h2 className="text-[15px] leading-4 font-bold">Detalhes da transação</h2>
          <div className="flex items-center justify-between">
            <span className="text-base font-bold">NFTs</span>
            <span className="flex items-center gap-12">
              <span className="text-base font-bold">Edições</span>
              <span className="text-base font-medium">Subtotal</span>
            </span>
          </div>
          <div className="h-px bg-kprimary/30" />
          <ul className="flex flex-col gap-3">
            {order.items.map((item) => (
              <ReceiptRow key={`${item.nftId}-${item.editionId}`} item={item} />
            ))}
          </ul>
          <dl className="ml-auto flex w-full max-w-[321px] flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[15px] leading-4 font-normal">Taxa de rede</dt>
              <dd className="text-lg leading-4 font-normal">{money(order.quote.feeEth)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-base font-bold">Total</dt>
              <dd className="text-lg font-bold text-kaccent">{money(order.quote.totalEth)}</dd>
            </div>
          </dl>
          <div className="h-px bg-kprimary/30" />
          <div className="flex flex-col items-center gap-12 text-center">
            <p className="max-w-[420px] text-sm leading-[22px] text-kmuted">
              Transação confirmada na {order.network}. A propriedade foi transferida para sua
              carteira conectada e registrada na rede.
            </p>
            <a
              role="button"
              href="https://etherscan.io"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 w-[186px] items-center justify-center rounded-[5px] bg-kprimary px-4 text-base font-bold text-kbg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kprimary"
            >
              Ver no Etherscan
            </a>
          </div>
        </div>
        <div className="h-[10px] shrink-0 bg-kprimary" />
      </article>
    </dialog>
  )
}

function ReceiptRow({ item }: { item: CartItem }) {
  return (
    <li className="flex h-[70px] items-center">
      <img src={item.image} alt="" className="size-[70px] rounded-lg object-cover" />
      <span className="ml-3 min-w-0 flex-1">
        <span className="block truncate text-base font-bold">{item.name}</span>
        <span className="mt-1.5 block text-sm text-kplaceholder">ID do token: {item.tokenId}</span>
      </span>
      <span className="flex items-center gap-12">
        <span className="text-sm text-kmuted">(x {item.quantity})</span>
        <span className="text-lg font-bold text-kaccent">{money(item.totalEth)}</span>
      </span>
    </li>
  )
}

function ThankYouMark() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true" className="text-kprimary">
      <path d="M36.698 25.9317C37.302 26.1624 37.9797 25.8588 38.2101 25.2536L38.6031 24.2217H41.3756L41.7637 25.2503C41.9408 25.7195 42.3867 26.0088 42.8603 26.0088C42.9978 26.0088 43.1376 25.9844 43.2739 25.933C43.8793 25.7045 44.185 25.0284 43.9564 24.4228L41.2489 17.2483C41.245 17.2378 41.2408 17.227 41.2365 17.2167C41.0297 16.7133 40.5443 16.3881 40.0001 16.3881C39.9998 16.3881 39.9995 16.3881 39.9992 16.3881C39.4545 16.3884 38.9692 16.7144 38.7629 17.2183C38.7594 17.2273 38.7556 17.2361 38.7523 17.2453L36.02 24.4195C35.7895 25.0242 36.0931 25.7013 36.698 25.9317V25.9317ZM40.4911 21.8781H39.4958L39.9956 20.5656L40.4911 21.8781Z" fill="currentColor" />
      <path d="M46.3301 26.0085C46.9774 26.0085 47.502 25.4839 47.502 24.8366V21.3327L50.2768 25.3508C50.6105 25.8333 51.1716 26.0377 51.7063 25.8708C52.2499 25.7013 52.601 25.1989 52.601 24.58L52.533 17.5486C52.5268 16.9053 52.0034 16.388 51.3615 16.388C51.3576 16.388 51.3537 16.388 51.3499 16.388C50.7026 16.3942 50.183 16.9241 50.1893 17.5711L50.224 21.1497L47.2945 16.9075C47.003 16.4855 46.4715 16.3024 45.9813 16.4547C45.4918 16.6074 45.1582 17.0606 45.1582 17.5735V24.8364C45.1582 25.4839 45.6827 26.0085 46.3301 26.0085Z" fill="currentColor" />
      <path d="M55.2482 26.0084C55.8956 26.0084 56.4201 25.4839 56.4201 24.8366V23.5698L58.6073 25.68C58.8346 25.8994 59.1279 26.0086 59.4207 26.0086C59.7278 26.0086 60.0343 25.8886 60.2642 25.6503C60.7135 25.1847 60.7003 24.4427 60.2345 23.9934L57.1904 21.0564L59.9556 18.5145C60.4321 18.0766 60.4634 17.3352 60.0253 16.8587C59.5874 16.3822 58.8459 16.3511 58.3695 16.7891L56.4199 18.5809V17.56C56.4199 16.9127 55.8954 16.3881 55.2481 16.3881C54.6007 16.3881 54.0762 16.9127 54.0762 17.56V24.8366C54.0763 25.4839 54.6009 26.0084 55.2482 26.0084V26.0084Z" fill="currentColor" />
      <path d="M28.4082 26.0084C29.0555 26.0084 29.5801 25.4839 29.5801 24.8366V22.2453H32.272V24.8366C32.272 25.4839 32.7965 26.0084 33.4438 26.0084C34.0912 26.0084 34.6157 25.4839 34.6157 24.8366V17.56C34.6157 16.9127 34.0912 16.3881 33.4438 16.3881C32.7965 16.3881 32.272 16.9127 32.272 17.56V19.9016H29.5801V17.56C29.5801 16.9127 29.0555 16.3881 28.4082 16.3881C27.7609 16.3881 27.2363 16.9127 27.2363 17.56V24.8366C27.2363 25.4839 27.7609 26.0084 28.4082 26.0084Z" fill="currentColor" />
      <path d="M25.6513 31.64L27.7842 34.9061L27.7759 38.273C27.7743 38.9203 28.2978 39.4463 28.9448 39.4478H28.9478C29.5937 39.4478 30.1181 38.925 30.1196 38.2789L30.1279 34.908L32.244 31.657C32.5971 31.1145 32.4437 30.3886 31.9014 30.0356C31.359 29.6822 30.6329 29.8359 30.2799 30.3783L28.9553 32.4131L27.6135 30.3586C27.2596 29.8166 26.5338 29.6645 25.9917 30.0181C25.4499 30.372 25.2973 31.0981 25.6513 31.64V31.64Z" fill="currentColor" />
      <path d="M43.7277 36.0064C43.7277 37.1997 44.2938 38.1662 45.4104 38.8798C45.9988 39.2556 46.6618 39.4467 47.381 39.4478H47.3864C48.0038 39.4478 48.5843 39.3133 49.1118 39.0475C50.4118 38.3928 51.1277 37.3109 51.1277 36.0011V30.9992C51.1277 30.3519 50.6032 29.8273 49.9558 29.8273C49.3085 29.8273 48.7839 30.3519 48.7839 30.9992V36.0011C48.7839 36.3061 48.696 36.6326 48.0575 36.9542C47.8574 37.0551 47.6379 37.104 47.3866 37.104C47.3858 37.104 47.3849 37.104 47.3841 37.104C47.1143 37.1037 46.8813 37.0384 46.6721 36.9048C46.1172 36.5503 46.0713 36.2776 46.0713 36.0065V30.9994C46.0713 30.352 45.5468 29.8275 44.8994 29.8275C44.2521 29.8275 43.7275 30.352 43.7275 30.9994V36.0064H43.7277Z" fill="currentColor" />
      <path d="M20.7627 18.7319H21.5921V24.8366C21.5921 25.4839 22.1166 26.0084 22.764 26.0084C23.4113 26.0084 23.9358 25.4839 23.9358 24.8366V18.7319H24.7813C25.4286 18.7319 25.9532 18.2073 25.9532 17.56C25.9532 16.9127 25.4286 16.3881 24.7813 16.3881H20.7627C20.1154 16.3881 19.5908 16.9127 19.5908 17.56C19.5908 18.2073 20.1154 18.7319 20.7627 18.7319V18.7319Z" fill="currentColor" />
      <path d="M37.6305 29.8275C34.9781 29.8275 32.8203 31.9855 32.8203 34.6377C32.8203 37.2898 34.9783 39.4478 37.6305 39.4478C40.283 39.4478 42.4408 37.2898 42.4408 34.6377C42.4408 31.9855 40.2828 29.8275 37.6305 29.8275ZM37.6305 37.1041C36.2705 37.1041 35.1641 35.9977 35.1641 34.6377C35.1641 33.2777 36.2705 32.1712 37.6305 32.1712C38.9905 32.1712 40.097 33.2777 40.097 34.6377C40.097 35.9977 38.9905 37.1041 37.6305 37.1041Z" fill="currentColor" />
      <path d="M70.7969 28.0734L67.347 24.4797V9.46422C67.347 7.37484 65.6472 5.67484 63.5577 5.67484H49.2933C49.2897 5.67109 49.2867 5.66687 49.2831 5.66313L46.5102 2.77469C44.7923 0.985469 42.4803 0 40 0C37.5197 0 35.2077 0.985469 33.49 2.77469L30.7056 5.675H16.4423C14.3528 5.675 12.653 7.375 12.653 9.46437V24.48L9.20313 28.0734C8.05203 29.2725 7.41797 30.8483 7.41797 32.5103V76.2106C7.41797 78.3002 9.11797 80 11.2073 80H68.7925C70.8819 80 72.5819 78.3002 72.5819 76.2106V32.5103C72.5819 30.8483 71.948 29.2725 70.7969 28.0734V28.0734ZM69.1061 29.6967C69.8361 30.457 70.2381 31.4564 70.2381 32.5105V35.168L67.3469 38.1797V27.8641L69.1061 29.6967ZM35.1806 4.39781C36.4523 3.07328 38.1637 2.34375 40 2.34375C41.8363 2.34375 43.5477 3.07328 44.8194 4.39781L46.0453 5.67484H33.9547L35.1806 4.39781ZM16.4423 8.01859H63.5575C64.3547 8.01859 65.0031 8.66703 65.0031 9.46422V40.6209L52.5639 53.5784L46.5098 47.2722C44.7922 45.483 42.4802 44.4975 39.9998 44.4975C37.5195 44.4975 35.2075 45.483 33.4898 47.2722L27.4358 53.5784L14.9966 40.6209V9.46422C14.9967 8.66719 15.6453 8.01859 16.4423 8.01859V8.01859ZM25.8116 55.2706L9.76188 71.9891V38.5522L25.8116 55.2706ZM9.76188 32.5103C9.76188 31.4562 10.1639 30.4569 10.8939 29.6966L12.6531 27.8641V38.1794L9.76188 35.1677V32.5103ZM68.7925 77.6562H11.2075C10.4103 77.6562 9.76188 77.0078 9.76188 76.2106V75.3733L35.1808 48.8953C36.4525 47.5706 38.1639 46.8412 40.0002 46.8412C41.8364 46.8412 43.5478 47.5708 44.8195 48.8953L54.2317 58.6997C54.68 59.1667 55.4217 59.1814 55.8886 58.7334C56.3553 58.2853 56.3706 57.5434 55.9223 57.0766L54.1886 55.2706L70.2383 38.5522V71.9891L59.6914 61.0028C59.2431 60.5359 58.5014 60.5209 58.0345 60.9691C57.5678 61.4172 57.5525 62.1591 58.0008 62.6259L70.2383 75.3733V76.2105C70.2381 77.0078 69.5897 77.6562 68.7925 77.6562V77.6562Z" fill="currentColor" />
    </svg>
  )
}

export function OrderRouteFallback({
  pending,
  refused,
  missing,
}: {
  pending?: boolean
  refused?: boolean
  missing?: boolean
}) {
  return (
    <main className={cn('grid min-h-svh place-items-center bg-kbg px-6 font-mono text-ktext')}>
      {pending ? (
        <p role="status" className="text-center text-sm text-kmuted">
          Pedido pendente. Aguardando a confirmação da rede.
        </p>
      ) : null}
      {refused ? (
        <div className="text-center">
          <h1 className="text-xl font-bold">Pagamento recusado</h1>
          <p className="mt-3 text-sm text-kmuted">Os itens continuam no carrinho.</p>
          <Link to="/carrinho" className="mt-4 inline-block text-kaccent">
            Voltar ao carrinho
          </Link>
        </div>
      ) : null}
      {missing ? (
        <div className="text-center" role="alert">
          <h1 className="text-xl font-bold">Pedido não encontrado</h1>
          <Link to="/" className="mt-4 inline-block text-kaccent">
            Voltar ao início
          </Link>
        </div>
      ) : null}
    </main>
  )
}
