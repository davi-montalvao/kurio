import { expect, test } from '@playwright/test'
import { addEmerald, fillPayment, logIn, openApp, signUp } from './support'

const receipt = 'Seus NFTs agora estão na sua carteira'

test('favorito otimista volta atrás quando a API falha', async ({ page }) => {
  await openApp(page, '/?cenario=favorito')
  await signUp(page)
  await page.goto('/nfts/emerald-ape-042')
  const button = page.getByRole('button', { name: 'Favoritar' })
  await expect(button).toHaveAttribute('aria-pressed', 'false')
  await button.click()
  await expect(button).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('status')).toHaveText('Não foi possível atualizar o favorito.')
  await expect(button).toHaveAttribute('aria-pressed', 'false')
})

test('o carrinho de uma conta não aparece na outra', async ({ page }) => {
  await addEmerald(page)
  await signUp(page)
  await expect(page.getByRole('link', { name: 'Carrinho, 1 item' })).toBeVisible()

  await page.goto('/perfil')
  await page.getByRole('button', { name: 'Sair' }).click()
  await expect(page.getByRole('link', { name: 'Carrinho', exact: true })).toBeVisible()

  await signUp(page, { username: 'outro', email: 'outro@kurio.test' })
  await expect(page.getByRole('link', { name: 'Carrinho', exact: true })).toBeVisible()

  await page.goto('/perfil')
  await page.getByRole('button', { name: 'Sair' }).click()
  await logIn(page, 'comprador@kurio.test')
  await expect(page.getByRole('link', { name: 'Carrinho, 1 item' })).toBeVisible()
})

test('pagamento recusado mantém o item no carrinho', async ({ page }) => {
  await addEmerald(page)
  await signUp(page)
  await page.goto('/pagamento')
  await fillPayment(page)
  await page.getByRole('textbox', { name: 'Observação do colecionador (opcional)' }).fill('recusar')
  await page.getByRole('button', { name: 'Confirmar compra' }).click()

  await expect(page.getByRole('alert').filter({ hasText: 'Pagamento recusado' })).toBeVisible()
  await expect(page.getByRole('heading', { name: receipt })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Carrinho, 1 item' })).toBeVisible()
})

test('um segundo clique não cria outro pedido', async ({ page }) => {
  await addEmerald(page)
  await signUp(page)
  await page.goto('/pagamento')
  await fillPayment(page)

  const posts: string[] = []
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().includes('/api/orders')) {
      posts.push(request.headers()['idempotency-key'] ?? '')
    }
  })

  const button = page.getByRole('button', { name: 'Confirmar compra' })
  await button.click()
  await expect(button).toBeDisabled()
  await expect(page.getByRole('heading', { name: receipt })).toBeVisible()
  expect(posts).toHaveLength(1)
})

test('timeout devolve o mesmo pedido na segunda confirmação', async ({ page }) => {
  await addEmerald(page)
  await signUp(page)
  await page.goto('/pagamento?cenario=timeout')
  await fillPayment(page)

  const button = page.getByRole('button', { name: 'Confirmar compra' })
  await button.click()
  await expect(page.getByRole('alert').filter({ hasText: 'A confirmação demorou demais' })).toBeVisible()
  const key = await page.evaluate(() => sessionStorage.getItem('kurio-checkout-order'))

  const response = page.waitForResponse(
    (item) => item.url().includes('/api/orders') && item.request().method() === 'POST' && item.status() === 200,
  )
  await button.click()
  const body = (await (await response).json()) as { id: string }
  expect(body.id).toBe(key)
  await expect(page.getByRole('heading', { name: receipt })).toBeVisible()
})

test('recarregar retoma o pedido que ficou pendente', async ({ page }) => {
  await addEmerald(page)
  await signUp(page)
  await page.goto('/pagamento?cenario=timeout')
  await fillPayment(page)
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'A confirmação demorou demais' })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { name: receipt })).toBeVisible()
})

test('salva perfil, senha, avatar e carteira', async ({ page }) => {
  await openApp(page)
  await signUp(page)
  await page.goto('/perfil')

  const profile = page.locator('main')
  await profile.getByLabel('Nome de exibição').fill('Davi')
  await profile.getByLabel('Apelido da carteira').fill('Principal')
  await profile.getByLabel('Nome ENS').fill('davi')
  await profile.getByRole('textbox', { name: /^Senha atual/ }).fill('senha123')
  await profile.getByRole('textbox', { name: /^Nova senha/ }).fill('senha1234')
  await profile.getByRole('textbox', { name: /^Confirmar nova senha/ }).fill('senha1234')
  await profile.locator('input[type="file"]').setInputFiles({
    name: 'avatar.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    ),
  })
  await expect(profile.locator('img')).toBeVisible()
  await profile.getByRole('button', { name: 'Salvar' }).click()
  await expect(profile.getByRole('status')).toHaveText('Perfil salvo')

  await page.getByRole('link', { name: 'Carteiras' }).click()
  const wallet = page.locator('main form').first()
  await wallet.getByLabel('Nome de exibição').fill('Davi')
  await wallet.getByLabel('Apelido da carteira').fill('Principal')
  await wallet.getByLabel('Rede').selectOption('Ethereum')
  await wallet.getByLabel('Nome do perfil').fill('Colecionador')
  await wallet.getByLabel('Endereço da carteira').fill('0x1111111111111111111111111111111111111111')
  await wallet.getByLabel('Tipo de carteira').selectOption('MetaMask')
  await wallet.getByLabel('Código de indicação').fill('KURIO')
  await wallet.getByLabel('E-mail').fill('comprador@kurio.test')
  await wallet.getByLabel('Nome ENS').fill('davi')
  await wallet.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByRole('status')).toHaveText('Carteira salva')

  await page.getByRole('button', { name: 'Sair' }).click()
  await logIn(page, 'comprador@kurio.test', 'senha1234')
  await page.goto('/perfil')
  await expect(page.locator('main').getByLabel('Nome de usuário')).toHaveValue('comprador')
})

test('lentidão mostra o esqueleto e depois o catálogo', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('kurio-nft-bump', '1'))
  await page.goto('/?cenario=lentidao')
  await expect(page.locator('#catalogo .skeleton').first()).toBeVisible()
  await expect(page.getByRole('link', { name: /Emerald Ape #042/ })).toBeVisible({ timeout: 20_000 })
})

test('catálogo vazio e edição esgotada', async ({ page }) => {
  await openApp(page, '/?cenario=vazio')
  await expect(page.getByText('Nenhum NFT encontrado com esses filtros.')).toBeVisible()

  await page.goto('/nfts/emerald-ape-042?cenario=esgotado')
  await expect(page.getByRole('radio', { name: /1\/50/ })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Comprar' })).toBeDisabled()
})
