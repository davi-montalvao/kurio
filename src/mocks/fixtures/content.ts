import emerald from '../../assets/nfts/emerald.png'
import golden from '../../assets/nfts/golden-mid.png'
import hero from '../../assets/nfts/hero.png'
import ivory from '../../assets/nfts/ivory.png'
import neon from '../../assets/nfts/neon.png'
import sage from '../../assets/nfts/sage.png'
import { homeContentSchema, type HomeContent } from '../../contracts/content'

export const homeContent: HomeContent = homeContentSchema.parse({
  heroSlides: [
    {
      id: 'boas-vindas',
      eyebrow: 'Bem-vindo à Kurio',
      title: 'Seja dono da\ncultura digital',
      description: 'Descubra NFTs selecionados de criadores do mundo todo.',
      ctaLabel: 'EXPLORAR →',
      ctaTarget: '#catalogo',
      image: {
        src: hero,
        alt: 'Macaco de jaqueta verde e óculos escuros, obra em destaque',
      },
      thumbnail: {
        src: sage,
        alt: 'Macaco de chapéu e moletom roxo',
      },
    },
    {
      id: 'sage-nomad-009',
      eyebrow: 'Arte digital',
      title: 'Sage Nomad #009',
      description: 'Sage Nomad #009 faz parte da coleção Arte digital, verificado na Ethereum.',
      ctaLabel: 'EXPLORAR →',
      ctaTarget: '/nfts/sage-nomad-009',
      image: {
        src: sage,
        alt: 'Sage Nomad #009',
      },
      thumbnail: {
        src: emerald,
        alt: 'Macaco de jaqueta verde e óculos escuros, obra em destaque',
      },
    },
    {
      id: 'neon-vessel-552',
      eyebrow: 'Arte digital',
      title: 'Neon Vessel #552',
      description: 'Neon Vessel #552 faz parte da coleção Arte digital, verificado na Ethereum.',
      ctaLabel: 'EXPLORAR →',
      ctaTarget: '/nfts/neon-vessel-552',
      image: {
        src: neon,
        alt: 'Neon Vessel #552',
      },
      thumbnail: {
        src: ivory,
        alt: 'Macaco de paletó claro',
      },
    },
  ],
  promos: [
    {
      title: 'Lançamentos gênesis de edição limitada',
      text: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
      image: hero,
      alt: 'Macaco de jaqueta verde e óculos',
      cta: 'Explorar',
    },
    {
      title: 'Arte digital selecionada e muito mais',
      text: 'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
      image: ivory,
      alt: 'Macaco de paletó claro',
      cta: 'Explorar',
    },
  ],
  diary: {
    title: 'Diário da Cunhagem',
    text: 'Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.',
    posts: [
      {
        date: '12 de setembro',
        reading: 'Leitura de 6 min',
        title: 'Como funciona a propriedade de NFTs',
        text: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
        image: ivory,
        alt: 'Macaco de paletó claro',
      },
      {
        date: '13 de setembro',
        reading: 'Leitura de 2 min',
        title: '10 artistas digitais para acompanhar',
        text: 'Conheça criadores que moldam a cultura digital.',
        image: hero,
        alt: 'Macaco de jaqueta verde e óculos',
      },
      {
        date: '15 de setembro',
        reading: 'Leitura de 3 min',
        title: 'Raridade, atributos e procedência',
        text: 'Entenda raridade, procedência, direitos autorais e utilidade.',
        image: sage,
        alt: 'Macaco de chapéu e moletom roxo',
      },
      {
        date: '15 de setembro',
        reading: 'Leitura de 2 min',
        title: 'Como proteger sua carteira',
        text: 'Proteja sua carteira, seus ativos e sua identidade.',
        image: golden,
        alt: 'Macaco de fone de ouvido',
      },
    ],
  },
  footer: {
    medallions: [
      {
        mark: 'W',
        title: 'Segurança da carteira',
        text: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
      },
      {
        mark: 'C',
        title: 'Criadores em destaque',
        text: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
      },
      {
        mark: 'D',
        title: 'Alertas de lançamentos',
        text: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
      },
    ],
    brand: 'KURIO',
    tagline: 'Feito para colecionadores, criadores e cultura',
    email: 'contato@email.com',
    phone: '+55 11 4002 8922',
    phoneHref: 'tel:+551140028922',
    columns: [
      {
        title: 'Meu perfil',
        links: [
          { label: 'Meu perfil', to: '/perfil' },
          { label: 'Minha coleção', to: null },
          { label: 'Atividade', to: null },
          { label: 'Estúdio do criador', to: null },
          { label: 'Lista de interesse', to: null },
        ],
      },
      {
        title: 'Central de ajuda',
        links: [
          { label: 'Central de ajuda', to: null },
          { label: 'Como comprar NFTs', to: null },
          { label: 'Carteira e segurança', to: null },
          { label: 'Política do mercado', to: null },
          { label: 'Denunciar item', to: null },
        ],
      },
      {
        title: 'Coleções',
        links: [
          { label: 'Arte digital', to: null },
          { label: 'Fotografia', to: null },
          { label: 'Música', to: null },
          { label: 'Arte 3D', to: null },
          { label: 'Utilidade', to: null },
        ],
      },
    ],
    socials: ['Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'YouTube'],
    wallets: ['METAMASK', 'WALLETCONNECT', 'COINBASE'],
    newsletterTitle: 'Antecipe-se ao próximo lançamento',
    newsletterHint: 'Receba lançamentos selecionados, histórias de criadores e novidades do mercado.',
    copyright: '© 2026 Kurio. Propriedade digital para todos.',
  },
})
