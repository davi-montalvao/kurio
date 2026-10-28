import { Outlet } from '@tanstack/react-router'
import { useState } from 'react'
import { useRequireSession } from '../../lib/require-session'
import { MobileScreenHeader } from '../mobile/mobile-chrome'
import { SiteHeader } from '../site-header'
import { Sheet } from '../ui/sheet'
import { AccountSidebar } from './account-sidebar'

export function AccountLayout() {
  const session = useRequireSession()
  const [menuOpen, setMenuOpen] = useState(false)

  if (session.isPending) {
    return (
      <div className="min-h-svh bg-kbg">
        <div className="skeleton mx-auto mt-24 h-96 max-w-[1200px]" />
      </div>
    )
  }

  if (!session.data) {
    return (
      <div className="hidden min-h-svh bg-kbg md:block">
        <SiteHeader active="inicio" />
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-kbg font-mono text-ktext">
      <div className="hidden md:block">
        <SiteHeader active="inicio" />
      </div>
      <div className="md:hidden">
        <MobileScreenHeader title="Perfil" />
      </div>
      <div className="mx-auto mt-8 flex max-w-[1200px] flex-col gap-7 px-6 lg:mt-8 lg:flex-row lg:px-0">
        <div className="lg:hidden">
          <button
            type="button"
            className="h-10 rounded-[3px] bg-ksurface px-4 text-[15px] text-kaccent"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            Meu perfil
          </button>
          <Sheet open={menuOpen} title="Meu perfil" onClose={() => setMenuOpen(false)}>
            <AccountSidebar onNavigate={() => setMenuOpen(false)} />
          </Sheet>
        </div>
        <div className="hidden w-[310px] shrink-0 lg:block">
          <AccountSidebar />
        </div>
        <main className="min-w-0 flex-1 lg:w-[862px]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
