import { expect, test } from '@playwright/test'
import { fillPayment, openApp, signUp } from './support'

test('o preço muda pelo socket e a compra espera a revisão', async ({ page }) => {
  await openApp(page, '/nfts/emerald-ape-042', true)
  await page.getByRole('button', { name: 'Comprar' }).click()
  await expect(page.getByText('Adicionado ao carrinho.')).toBeVisible()
  await signUp(page)

  await page.goto('/pagamento')
  await fillPayment(page)
  await expect(page.getByRole('button', { name: 'Revisar resumo' })).toBeVisible({
    timeout: 15_000,
  })
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeDisabled()
  await expect(
    page
      .getByRole('complementary', { name: 'Revisão do pedido' })
      .getByText(/O preço de Emerald Ape #042 mudou para/),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Revisar resumo' }).click()
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeEnabled()
})
