import { expect, test } from '@playwright/test'
import { openApp } from './support'

test('cadastra, sai e entra de novo', async ({ page }) => {
  await openApp(page)
  await page.getByRole('button', { name: 'Entrar' }).click()

  const dialog = page.getByRole('dialog')
  await dialog.getByRole('tab', { name: 'Criar conta' }).click()
  await dialog.getByLabel('Nome de usuário').fill('colecionador')
  await dialog.getByLabel('E-mail').fill('colecionador@kurio.test')
  await dialog.getByRole('textbox', { name: 'Senha', exact: true }).fill('senha123')
  await dialog.getByRole('textbox', { name: 'Confirmar senha' }).fill('senha123')
  await dialog.getByRole('button', { name: 'Criar conta' }).last().click()
  await expect(dialog).toBeHidden()

  await page.goto('/perfil')
  await expect(page.locator('main').getByLabel('Nome de usuário')).toHaveValue('colecionador')
  await page.getByRole('button', { name: 'Sair' }).click()
  await expect(page).toHaveURL('/')

  await page.getByRole('button', { name: 'Entrar' }).click()
  const login = page.getByRole('dialog')
  await login.getByLabel('E-mail').fill('colecionador@kurio.test')
  await login.getByRole('textbox', { name: 'Senha', exact: true }).fill('senha123')
  await login.getByRole('button', { name: 'Entrar' }).last().click()
  await expect(login).toBeHidden()

  await page.goto('/perfil')
  await expect(page.locator('main').getByLabel('Nome de usuário')).toHaveValue('colecionador')
})

test('credencial inválida avisa e Esc devolve o foco', async ({ page }) => {
  await openApp(page)
  const entrar = page.getByRole('button', { name: 'Entrar' })
  await entrar.click()

  const dialog = page.getByRole('dialog')
  await expect(dialog.getByLabel('E-mail')).toBeFocused()
  await dialog.getByLabel('E-mail').fill('nao@kurio.test')
  await dialog.getByRole('textbox', { name: 'Senha' }).fill('errada')
  await dialog.getByRole('button', { name: 'Entrar' }).click()
  await expect(dialog.getByRole('alert')).toBeVisible()

  await dialog.getByRole('button', { name: 'Continuar com Google' }).click()
  await expect(dialog.getByRole('status')).toContainText('indisponível')

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(entrar).toBeFocused()
})

test('atalho /login abre o modal na home', async ({ page }) => {
  await openApp(page, '/login')
  await expect(page).toHaveURL(/auth=login/)
  await expect(page.getByRole('dialog')).toBeVisible()
})
