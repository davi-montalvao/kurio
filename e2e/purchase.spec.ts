import { expect, test } from '@playwright/test'
import { addEmerald, fillPayment, signUp } from './support'

test('compra do catálogo até o recibo', async ({ page }) => {
  await addEmerald(page)
  await signUp(page)
  await page.goto('/pagamento')
  await fillPayment(page)
  await page.getByRole('button', { name: 'Confirmar compra' }).click()

  await expect(
    page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Ver no Etherscan' })).toBeVisible()
})
