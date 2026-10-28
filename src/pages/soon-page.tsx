import { useParams } from '@tanstack/react-router'

const titles: Record<string, string> = {
  atividade: 'Atividade',
  interesse: 'Lista de interesse',
  ofertas: 'Ofertas',
  arquivos: 'Arquivos baixados',
  suporte: 'Suporte',
}

export function SoonPage() {
  const { section } = useParams({ strict: false })
  const title = titles[String(section)] ?? 'Em breve'

  return (
    <section className="pb-16">
      <h2 className="text-base leading-4 font-bold">{title}</h2>
      <p className="mt-4 text-sm text-kmuted">Em breve.</p>
    </section>
  )
}
