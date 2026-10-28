import { expect, test } from '@playwright/test'
import { addEmerald, openApp, signUp } from './support'

test('início', async ({ page }) => {
  await openApp(page)
  await expect(page.getByRole('link', { name: /Emerald Ape #042/ })).toBeVisible()
  await expect(page).toHaveScreenshot('inicio.png')
})

test('detalhe', async ({ page }) => {
  await openApp(page, '/nfts/emerald-ape-042')
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
  await expect(page).toHaveScreenshot('detalhe.png')
})

test('carrinho', async ({ page }) => {
  await addEmerald(page)
  await page.goto('/carrinho')
  await expect(page.getByRole('heading', { name: 'Resumo da carteira' })).toBeVisible()
  await expect(page).toHaveScreenshot('carrinho.png')
})

test('pagamento', async ({ page }) => {
  await addEmerald(page)
  await signUp(page)
  await page.goto('/pagamento')
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
  await expect(page).toHaveScreenshot('pagamento.png')
})
