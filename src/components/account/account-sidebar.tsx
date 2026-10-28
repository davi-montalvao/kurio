import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import type { ComponentType, SVGProps } from 'react'
import {
  ActivityIcon,
  DownloadIcon,
  HeartIcon,
  LogoutIcon,
  OffersIcon,
  SupportIcon,
  UserIcon,
  WalletIcon,
} from '../icons/AccountIcons'
import { api } from '../../lib/api'
import { cn } from '../../lib/cn'

type Icon = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>

const items: Array<{
  id: string
  label: string
  to: string
  icon: Icon
  size: number
}> = [
  { id: 'dados', label: 'Dados do perfil', to: '/perfil', icon: UserIcon, size: 18 },
  { id: 'carteiras', label: 'Carteiras', to: '/perfil/carteiras', icon: WalletIcon, size: 20 },
  { id: 'atividade', label: 'Atividade', to: '/perfil/atividade', icon: ActivityIcon, size: 18 },
  { id: 'interesse', label: 'Lista de interesse', to: '/perfil/interesse', icon: HeartIcon, size: 16 },
  { id: 'ofertas', label: 'Ofertas', to: '/perfil/ofertas', icon: OffersIcon, size: 18 },
  { id: 'arquivos', label: 'Arquivos baixados', to: '/perfil/arquivos', icon: DownloadIcon, size: 18 },
  { id: 'suporte', label: 'Suporte', to: '/perfil/suporte', icon: SupportIcon, size: 18 },
]

type AccountSidebarProps = {
  onNavigate?: () => void
}

export function AccountSidebar({ onNavigate }: AccountSidebarProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const logout = useMutation({
    mutationFn: async () => {
      await api.delete('/session')
    },
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: ['session'] })
      queryClient.removeQueries({ queryKey: ['wallets'] })
      queryClient.removeQueries({ queryKey: ['favorites'] })
      queryClient.removeQueries({ queryKey: ['order'] })
      queryClient.removeQueries({ queryKey: ['cart'] })
      await navigate({ to: '/' })
    },
  })

  return (
    <aside className="bg-ksurface py-2 font-mono">
      <p className="px-2.5 py-2.5 text-lg leading-4 font-bold">Meu perfil</p>
      <nav aria-label="Perfil">
        <ul>
          {items.map((item, index) => {
            const active = item.to === '/perfil' ? pathname === '/perfil' : pathname === item.to
            const Icon = item.icon
            return (
              <li key={item.id}>
                <Link
                  to={item.to}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex h-[45px] items-center text-[15px] leading-[45px] font-normal text-kaccent',
                    index === 0 ? 'gap-4 px-4' : 'gap-3 px-4',
                    active ? 'border-l-[6px] border-kprimary' : 'border-l-[6px] border-transparent',
                  )}
                  onClick={onNavigate}
                >
                  <Icon size={item.size} className={active ? 'text-kprimary' : 'text-kplaceholder'} />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
      <div className="mx-4 h-px bg-kprimary/30" />
      <button
        type="button"
        className="flex h-10 w-full items-center gap-2 px-4 text-[15px] font-bold text-kaccent"
        onClick={() => logout.mutate()}
      >
        <LogoutIcon size={20} className="text-kprimary" />
        Sair
      </button>
    </aside>
  )
}
