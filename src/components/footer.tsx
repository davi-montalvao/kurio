import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState, type FormEvent, type ReactNode } from 'react'
import { cn } from '../lib/cn'
import { contentQueryOptions } from '../queries/content'
import type { HomeContent } from '../contracts/content'

const socialIcons: Record<string, ReactNode> = {
  Facebook: (
    <path d="M14 8h-2V6.5c0-.5.3-.7.8-.7H14V4h-1.7C10.4 4 9.5 5.1 9.5 6.8V8H8v2h1.5v6H12v-6h1.6L14 8Z" />
  ),
  Instagram: (
    <>
      <rect x="4.5" y="4.5" width="11" height="11" rx="3" />
      <circle cx="10" cy="10" r="2.4" />
      <circle cx="13.2" cy="6.8" r="0.7" fill="currentColor" stroke="none" />
    </>
  ),
  Twitter: <path d="M5 5.2 8.7 10 5 14.8h1.3l3-3.6 2.6 3.6H15L11.1 9.7 14.6 5.2h-1.3L10.5 8.5 8.1 5.2H5Z" />,
  LinkedIn: (
    <path d="M6.2 8.2H4.2V15h2V8.2ZM5.2 4.2a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2ZM15.8 15h-2v-3.3c0-.9-.4-1.5-1.2-1.5s-1.3.6-1.3 1.5V15h-2V8.2h2v.9c.4-.6 1.1-1.1 2.2-1.1 1.6 0 2.3 1 2.3 2.9V15Z" />
  ),
  YouTube: (
    <>
      <rect x="3.5" y="6" width="13" height="8" rx="2" />
      <path d="M9 8.2v3.6l3.2-1.8L9 8.2Z" fill="currentColor" stroke="none" />
    </>
  ),
}

function bandCell(index: number) {
  return cn(
    'px-6 py-8',
    index > 0 && 'max-md:border-t max-md:border-[#D28A4C]',
    index % 2 === 1 && 'md:max-lg:border-l md:max-lg:border-[#D28A4C]',
    index > 0 && 'lg:border-l lg:border-[#D28A4C]',
  )
}

export function Footer() {
  const content = useQuery(contentQueryOptions())

  if (content.isPending) {
    return <footer className="skeleton h-40 w-full" />
  }

  if (content.isError) {
    return (
      <footer className="px-6 py-8 text-sm text-kmuted" role="alert">
        <p>Não foi possível carregar o rodapé.</p>
        <button type="button" className="mt-3 font-semibold text-kaccent" onClick={() => content.refetch()}>
          Tentar de novo
        </button>
      </footer>
    )
  }

  const footer = content.data.footer

  return (
    <footer className="relative z-0 w-full pb-36 font-mono text-sm text-sand lg:pb-0">
      <div className="lg:mx-auto lg:w-full lg:max-w-[1200px]">
        <div className="bg-panel">
          <div className="grid w-full md:grid-cols-2 lg:grid-cols-4">
            {footer.medallions.map((item, index) => (
              <FeatureMedallion key={item.mark} index={index} {...item} />
            ))}
            <NewsletterForm
              index={footer.medallions.length}
              title={footer.newsletterTitle}
              hint={footer.newsletterHint}
            />
          </div>
        </div>

        <div className="bg-line text-sand lg:bg-ksurface-2 lg:text-ktext">
          <div className="grid w-full gap-4 px-6 py-6 md:grid-cols-2 lg:grid-cols-4 lg:items-center lg:gap-x-[92px] lg:px-8 lg:py-8">
            <p className="font-bold tracking-[0.1em] text-white lg:text-sm lg:text-ktext">{footer.brand}</p>
            <p>{footer.tagline}</p>
            <a
              href={`mailto:${footer.email}`}
              className="hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
            >
              {footer.email}
            </a>
            <a
              href={footer.phoneHref}
              className="hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
            >
              {footer.phone}
            </a>
          </div>
        </div>

        <div className="bg-panel">
          <nav aria-label="Rodapé" className="grid w-full md:grid-cols-2 lg:grid-cols-4">
            {footer.columns.map((column, index) => (
              <FooterLinkColumn key={column.title} index={index} title={column.title} links={column.links} />
            ))}
            <div className={bandCell(footer.columns.length)}>
              <h2 className="font-semibold text-white lg:text-lg lg:leading-4 lg:text-ktext">Redes sociais</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {footer.socials.map((label) => (
                  <li key={label}>
                    <a
                      href="#"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="grid size-9 place-items-center rounded-md border border-kprimary text-kprimary hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kprimary lg:size-[30px]"
                    >
                      <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                        {socialIcons[label]}
                      </svg>
                    </a>
                  </li>
                ))}
              </ul>
              <h2 className="mt-6 font-semibold text-white lg:mt-8 lg:text-lg lg:leading-4 lg:text-ktext">
                Carteiras compatíveis
              </h2>
              <p className="mt-3 inline-block rounded-full border border-ember px-3 py-1 text-[10px] tracking-wide text-ember lg:rounded-md lg:border-kborder-2 lg:bg-ksurface-2 lg:px-3 lg:py-1 lg:text-[9px] lg:font-bold lg:tracking-[0.1px] lg:text-kaccent">
                {footer.wallets.join(' · ')}
              </p>
            </div>
          </nav>
        </div>
        <p className="px-6 pt-4 pb-6 text-center text-xs text-muted lg:pt-1.5 lg:pb-8 lg:text-sm lg:leading-[30px] lg:text-ktext">
          {footer.copyright}
        </p>
      </div>
    </footer>
  )
}

function FeatureMedallion({
  index,
  mark,
  title,
  text,
}: {
  index: number
  mark: string
  title: string
  text: string
}) {
  return (
    <article className={bandCell(index)}>
      <span className="grid size-[54px] place-items-center rounded-full bg-kprimary text-lg font-semibold text-kbg lg:size-[74px] lg:text-2xl lg:font-bold">
        {mark}
      </span>
      <h2 className="mt-4 font-semibold text-white lg:text-[17px] lg:leading-4 lg:text-ktext">{title}</h2>
      <p className="mt-2 leading-relaxed text-ember lg:max-w-[204px] lg:text-sm lg:leading-[22px] lg:text-kmuted">{text}</p>
    </article>
  )
}

function NewsletterForm({ index, title, hint }: { index: number; title: string; hint: string }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Informe um e-mail válido')
      return
    }
    setError('')
    setEmail('')
  }

  return (
    <form className={bandCell(index)} onSubmit={submit}>
      <h2 className="font-semibold text-white lg:text-lg lg:text-ktext">{title}</h2>
      <div className="mt-4 flex">
        <label className="sr-only" htmlFor="launch-email">
          E-mail
        </label>
        <input
          id="launch-email"
          type="email"
          required
          value={email}
          placeholder="digite seu e-mail..."
          className="h-8 min-w-0 flex-1 rounded-l-md bg-[#372211] px-3 text-sm outline-none placeholder:text-[#a89080] focus-visible:outline focus-visible:outline-2 focus-visible:outline-ember lg:h-10 lg:bg-ksurface-2 lg:placeholder:text-kplaceholder"
          onChange={(event) => {
            setEmail(event.target.value)
            setError('')
          }}
        />
        <button
          type="submit"
          className="h-8 shrink-0 rounded-r-md bg-kprimary px-4 font-semibold text-kbg hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kprimary lg:h-10 lg:w-[85px] lg:text-lg lg:font-bold"
        >
          Enviar
        </button>
      </div>
      {error ? (
        <p className="mt-2 text-xs text-ember" role="alert">
          {error}
        </p>
      ) : null}
      <p className="mt-3 leading-relaxed text-ember lg:text-[13px] lg:leading-[22px] lg:text-kmuted">{hint}</p>
    </form>
  )
}

function FooterLinkColumn({
  index,
  title,
  links,
}: {
  index: number
  title: string
  links: HomeContent['footer']['columns'][number]['links']
}) {
  return (
    <div className={bandCell(index)}>
      <h2 className="font-semibold text-white lg:text-lg lg:leading-4 lg:text-ktext">{title}</h2>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.label}>
            {link.to === '/perfil' ? (
              <Link
                to="/perfil"
                className="hover:text-kaccent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kprimary lg:text-sm lg:leading-[30px] lg:text-ktext"
              >
                {link.label}
              </Link>
            ) : (
              <a
                href={link.to ?? '#'}
                className="hover:text-kaccent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kprimary lg:text-sm lg:leading-[30px] lg:text-ktext"
              >
                {link.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
