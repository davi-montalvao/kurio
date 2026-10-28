import { expect, test } from '@playwright/test'
import { fillPayment, openApp } from './support'

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
})

test('compra no celular até o recibo', async ({ page }) => {
  await openApp(page, '/nfts/emerald-ape-042')
  await page.getByRole('button', { name: 'Comprar' }).click()
  await expect(page.getByText('Adicionado ao carrinho.')).toBeVisible()

  await page.goto('/carrinho')
  await expect(page.getByRole('list', { name: 'Itens do carrinho' })).toBeVisible()
  await page.getByRole('textbox', { name: 'Código promocional' }).fill('KURIO10')
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'KURIO10' })).toBeVisible()

  await page.goto('/entrar?redirect=/pagamento')
  await page.getByRole('button', { name: 'Crie uma conta' }).click()
  await page.getByLabel('Nome de usuário').fill('celular')
  await page.getByLabel('E-mail').fill('celular@kurio.test')
  await page.getByRole('textbox', { name: 'Senha', exact: true }).fill('senha123')
  await page.getByRole('textbox', { name: 'Confirmar senha' }).fill('senha123')
  await page.getByRole('button', { name: 'Criar conta' }).click()

  await expect(page).toHaveURL(/\/pagamento/)
  await fillPayment(page)
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(
    page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
  ).toBeVisible()
})
