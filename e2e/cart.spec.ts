import { expect, test } from '@playwright/test'
import { addEmerald } from './support'

test('altera quantidade, aplica cupom e mantém o carrinho no refresh', async ({ page }) => {
  await addEmerald(page)
  await page.getByRole('link', { name: /Carrinho/ }).click()
  await expect(page.getByRole('link', { name: /Emerald Ape #042/ })).toBeVisible()

  await page.getByRole('button', { name: 'Aumentar Emerald Ape #042' }).click()
  await expect(page.getByRole('link', { name: 'Carrinho, 2 itens' })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('link', { name: 'Carrinho, 2 itens' })).toBeVisible()

  const desktop = page.locator('main')
  await desktop.getByLabel('Código promocional').fill('KURIO10')
  await desktop.getByRole('button', { name: 'Aplicar' }).click()
  await expect(desktop.getByText('KURIO10')).toBeVisible()

  await page.getByRole('button', { name: 'Remover Emerald Ape #042' }).click()
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
})
