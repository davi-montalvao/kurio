import { expect, test } from '@playwright/test'
import { openApp } from './support'

test('abre o detalhe direto pelo endereço', async ({ page }) => {
  await openApp(page, '/nfts/emerald-ape-042')
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
})

test('mostra o NFT inexistente', async ({ page }) => {
  await openApp(page, '/nfts/nao-existe')
  await expect(page.getByRole('heading', { name: 'NFT não encontrado' })).toBeVisible()
})
