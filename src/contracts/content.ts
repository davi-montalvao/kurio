import { z } from 'zod'

const linkSchema = z.object({
  label: z.string(),
  to: z.string().nullable(),
})

const heroImageSchema = z.object({
  src: z.string(),
  alt: z.string(),
})

export const heroSlideSchema = z.object({
  id: z.string(),
  eyebrow: z.string(),
  title: z.string(),
  description: z.string(),
  ctaLabel: z.string(),
  ctaTarget: z.string(),
  image: heroImageSchema,
  thumbnail: heroImageSchema,
})

export type HeroSlide = z.infer<typeof heroSlideSchema>

export const homeContentSchema = z.object({
  heroSlides: z.array(heroSlideSchema),
  promos: z.array(
    z.object({
      title: z.string(),
      text: z.string(),
      image: z.string(),
      alt: z.string(),
      cta: z.string(),
    }),
  ),
  diary: z.object({
    title: z.string(),
    text: z.string(),
    posts: z.array(
      z.object({
        date: z.string(),
        reading: z.string(),
        title: z.string(),
        text: z.string(),
        image: z.string(),
        alt: z.string(),
      }),
    ),
  }),
  footer: z.object({
    medallions: z.array(
      z.object({
        mark: z.string(),
        title: z.string(),
        text: z.string(),
      }),
    ),
    brand: z.string(),
    tagline: z.string(),
    email: z.string(),
    phone: z.string(),
    phoneHref: z.string(),
    columns: z.array(
      z.object({
        title: z.string(),
        links: z.array(linkSchema),
      }),
    ),
    socials: z.array(z.string()),
    wallets: z.array(z.string()),
    newsletterTitle: z.string(),
    newsletterHint: z.string(),
    copyright: z.string(),
  }),
})

export type HomeContent = z.infer<typeof homeContentSchema>
