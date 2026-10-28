import { expect, test } from '@playwright/test'
import { openApp } from './support'

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 390, height: 844 })
})

test('carrossel do hero', async ({ page }) => {
  await openApp(page)
  const hero = page.getByRole('region', { name: 'Destaques' })
  await expect(hero.getByRole('group', { name: '1 de 3' })).toBeVisible()
  await expect(hero.locator('.hero-orb-1')).toHaveCSS('background-image', /linear-gradient/)
  await expect(hero.locator('.hero-orb-2')).toHaveCSS('background-image', /linear-gradient/)

  const second = hero.getByRole('button', { name: 'Ir para o destaque 2 de 3' })
  await second.click()
  await expect(hero.getByRole('group', { name: '2 de 3' })).toBeVisible()
  await expect(second).toHaveAttribute('aria-current', 'true')
  await expect(hero.getByRole('heading', { name: /Sage Nomad #009/ })).toBeVisible()

  await page.keyboard.press('ArrowRight')
  await expect(hero.getByRole('group', { name: '3 de 3' })).toBeVisible()
})

test('não avança sozinho com reduced motion', async ({ page }) => {
  await openApp(page)
  const hero = page.getByRole('region', { name: 'Destaques' })
  await expect(hero.getByRole('group', { name: '1 de 3' })).toBeVisible()
  await page.waitForTimeout(5500)
  await expect(hero.getByRole('button', { name: 'Ir para o destaque 1 de 3' })).toHaveAttribute(
    'aria-current',
    'true',
  )
})

test('regressão visual do hero', async ({ page }) => {
  await openApp(page)
  const hero = page.getByRole('region', { name: 'Destaques' })
  await expect(hero.getByRole('group', { name: '1 de 3' })).toBeVisible()
  await expect(hero).toHaveScreenshot('hero-mobile.png')
})
