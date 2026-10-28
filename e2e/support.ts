import { expect, type Page } from '@playwright/test'

export async function openApp(page: Page, path = '/', live = false) {
  await page.addInitScript((allowLive) => {
    if (!allowLive) sessionStorage.setItem('kurio-nft-bump', '1')
  }, live)
  await page.goto(path)
  await page.evaluate(() => document.fonts.ready)
}

type Account = {
  username: string
  email: string
  password?: string
}

const buyer: Account = { username: 'comprador', email: 'comprador@kurio.test' }

export async function signUp(page: Page, account: Account = buyer) {
  const password = account.password ?? 'senha123'
  await page.getByRole('button', { name: 'Entrar' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('tab', { name: 'Criar conta' }).click()
  await dialog.getByLabel('Nome de usuário').fill(account.username)
  await dialog.getByLabel('E-mail').fill(account.email)
  await dialog.getByRole('textbox', { name: 'Senha', exact: true }).fill(password)
  await dialog.getByRole('textbox', { name: 'Confirmar senha' }).fill(password)
  await dialog.getByRole('button', { name: 'Criar conta' }).last().click()
  await expect(dialog).toBeHidden()
}

export async function logIn(page: Page, email: string, password = 'senha123') {
  await page.getByRole('button', { name: 'Entrar' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('E-mail').fill(email)
  await dialog.getByRole('textbox', { name: 'Senha', exact: true }).fill(password)
  await dialog.getByRole('button', { name: 'Entrar' }).last().click()
  await expect(dialog).toBeHidden()
}

export async function addEmerald(page: Page) {
  await openApp(page, '/nfts/emerald-ape-042')
  await page.getByRole('button', { name: 'Comprar' }).click()
  await expect(page.getByText('Adicionado ao carrinho.')).toBeVisible()
}

export async function fillPayment(page: Page) {
  const form = page.locator('form:visible').filter({
    has: page.getByRole('button', { name: 'Confirmar compra' }),
  })
  await form.getByLabel('Nome de exibição').fill('Davi')
  await form.getByLabel('Nome de usuário').fill('colecionador')
  await form.locator('select[name="network"]').selectOption('Ethereum')
  await form.getByLabel('Nome do perfil').fill('Colecionador')
  await form.getByLabel('Endereço da carteira').fill('0x1111111111111111111111111111111111111111')
  await form.locator('select[name="walletType"]').selectOption('MetaMask')
  await form.getByLabel('Código de indicação').fill('KURIO')
  await form.getByLabel('E-mail').fill('davi@kurio.test')
  await form.getByLabel('Nome ENS').fill('davi')
  await form.getByRole('radio', { name: /MetaMask$/ }).check()
  await form.getByRole('button', { name: 'Conectar', exact: true }).click()
  await expect(form.getByText('Carteira conectada')).toBeVisible()
}
