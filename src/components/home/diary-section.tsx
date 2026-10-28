import { useQuery } from '@tanstack/react-query'
import { contentQueryOptions } from '../../queries/content'

export function DiarySection() {
  const content = useQuery(contentQueryOptions())

  if (content.isPending) {
    return <section className="skeleton mx-auto mt-24 h-[369px] max-w-[1200px]" />
  }

  if (content.isError) {
    return (
      <section className="mx-auto mt-24 max-w-[1200px]" role="alert">
        <p>Não foi possível carregar o diário.</p>
        <button type="button" className="mt-3 text-sm font-semibold text-kaccent" onClick={() => content.refetch()}>
          Tentar de novo
        </button>
      </section>
    )
  }

  const diary = content.data.diary

  return (
    <section className="mx-auto mt-24 flex max-w-[1200px] flex-col gap-10 px-4 pb-24 font-mono xl:px-0">
      <div className="flex flex-col items-center gap-3 text-center">
        <h2 className="text-[28px] font-bold text-ktext">{diary.title}</h2>
        <p className="text-sm text-kmuted">{diary.text}</p>
      </div>
      <ul className="grid grid-cols-2 gap-6 xl:grid-cols-4">
        {diary.posts.map((post) => (
          <li key={post.title} className="h-[369px] min-w-0 overflow-hidden rounded-lg bg-ksurface">
            <img src={post.image} alt={post.alt} className="h-[195px] w-full object-cover" />
            <div className="flex flex-col gap-2 px-4 pt-3 pb-4">
              <p className="text-xs leading-4 font-medium text-kmuted">
                {post.date} | {post.reading}
              </p>
              <h3 className="text-base font-bold text-ktext">{post.title}</h3>
              <p className="text-xs leading-4 font-medium text-kmuted">{post.text}</p>
              <p className="text-xs leading-[14px] font-bold text-kaccent">Ler mais →</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
