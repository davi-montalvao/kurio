import { useEffect, useState } from 'react'
import { DiarySection } from '../components/home/diary-section'
import { CatalogSection } from '../components/home/catalog-section'
import { HeroSection } from '../components/home/hero-section'
import { Footer } from '../components/footer'
import { MobileHomeBar } from '../components/home/mobile-home-bar'
import { MobileTabBar } from '../components/home/mobile-tab-bar'
import { PromoSection } from '../components/home/promo-section'
import { SiteHeader } from '../components/site-header'

export function HomePage() {
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    const open = () => setFiltersOpen(true)
    window.addEventListener('kurio:open-filters', open)
    return () => window.removeEventListener('kurio:open-filters', open)
  }, [])

  return (
    <div id="topo" className="min-h-svh bg-kbg text-ktext">
      <div className="hidden md:block">
        <SiteHeader />
      </div>
      <MobileHomeBar
        filtersOpen={filtersOpen}
        onToggleFilters={() => setFiltersOpen((open) => !open)}
      />
      <main>
        <HeroSection />
        <CatalogSection
          filtersOpen={filtersOpen}
          onCloseFilters={() => setFiltersOpen(false)}
        />
        <div className="hidden md:block">
          <PromoSection />
          <DiarySection />
        </div>
      </main>
      <MobileTabBar />
      <Footer />
    </div>
  )
}
