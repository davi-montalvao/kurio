import { expect, test } from '@playwright/test'
import { openApp } from './support'

test.beforeEach(async ({ page }) => {
  await openApp(page)
  await expect(page.getByRole('link', { name: /Emerald Ape #042/ })).toBeVisible()
})

test('busca um NFT e o histórico restaura a lista', async ({ page }) => {
  await page.getByRole('button', { name: 'Abrir busca' }).click()
  await page.getByRole('textbox', { name: 'Buscar NFTs' }).fill('Emerald')
  await page.getByRole('button', { name: 'Buscar' }).click()

  await expect(page.getByRole('link', { name: /Emerald Ape #042/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /Violet Nomad #314/ })).toHaveCount(0)

  await page.goBack()
  await expect(page.getByRole('link', { name: /Violet Nomad #314/ })).toBeVisible()
})

test('filtra coleção e rede juntas', async ({ page }) => {
  await page.getByRole('group', { name: 'Coleções' }).getByText(/^Arte digital/).click()
  await page.getByRole('group', { name: 'Rede' }).getByText(/^Polygon/).click()

  await expect(page.getByRole('link', { name: /Violet Nomad #314/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /Emerald Ape #042/ })).toHaveCount(0)
})

test('ordena pelo menor preço', async ({ page }) => {
  await page.getByLabel('Ordenar por:').selectOption('Menor preço')
  await expect(page).toHaveURL(/ordenar=preco-asc/)

  const prices = await page.locator('#catalogo ul p').allTextContents()
  const values = prices
    .map((text) => text.match(/(\d+),(\d+)/))
    .filter((match) => match !== null)
    .map((match) => Number(`${match[1]}.${match[2]}`))

  expect(values.length).toBeGreaterThan(1)
  expect(values[0]).toBeLessThanOrEqual(values[1])
})

test('pagina o catálogo e volta pelo histórico', async ({ page }) => {
  const pages = page.getByRole('navigation', { name: 'Paginação do catálogo' })
  await pages.getByRole('button', { name: '2', exact: true }).click()
  await expect(page).toHaveURL(/pagina=2/)

  await page.goBack()
  await expect(page).not.toHaveURL(/pagina=2/)
  await expect(pages.getByRole('button', { name: '1', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
})
