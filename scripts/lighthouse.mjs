import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { launch } from 'chrome-launcher'
import lighthouse, { desktopConfig } from 'lighthouse'
import { chromium } from '@playwright/test'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const origin = 'http://127.0.0.1:4173'
const chromePath = chromium.executablePath()
const userDataDir = path.join(tmpdir(), 'kurio-lighthouse-profile')
const pages = [
  { name: 'Início', path: '/' },
  { name: 'Detalhe', path: '/nfts/emerald-ape-042' },
]
const profiles = [
  { name: 'mobile', config: undefined },
  { name: 'desktop', config: desktopConfig },
]
const goals = {
  performance: 90,
  accessibility: 95,
  'best-practices': 95,
  seo: 90,
}
const labels = {
  performance: 'Performance',
  accessibility: 'Acessibilidade',
  'best-practices': 'Boas práticas',
  seo: 'SEO',
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

function score(result, id) {
  return Math.round((result.lhr.categories[id]?.score ?? 0) * 100)
}

function metric(result, id) {
  return result.lhr.audits[id]?.numericValue ?? 0
}

function slug(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

async function waitForPreview() {
  const started = Date.now()
  while (Date.now() - started < 30_000) {
    try {
      const response = await fetch(origin)
      if (response.ok) return
    } catch {
      // The preview process is still booting.
    }
    await new Promise((resolve) => setTimeout(resolve, 300))
  }
  throw new Error('O preview não respondeu')
}

async function warmProfile() {
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: true,
    executablePath: chromePath,
  })
  const page = context.pages()[0] ?? (await context.newPage())
  await page.goto(origin)
  await page.getByRole('link', { name: /Emerald Ape #042/ }).waitFor({ timeout: 20_000 })
  await context.close()
}

const preview = spawn(
  process.execPath,
  [
    path.join(root, 'node_modules', 'vite', 'bin', 'vite.js'),
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    '4173',
    '--strictPort',
  ],
  { cwd: root, stdio: 'inherit' },
)

let chrome
try {
  await waitForPreview()
  await warmProfile()
  chrome = await launch({
    chromePath,
    chromeFlags: [
      `--user-data-dir=${userDataDir}`,
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
    ],
  })

  const rows = []
  for (const page of pages) {
    for (const profile of profiles) {
      const samples = []
      for (let run = 1; run <= 3; run += 1) {
        const result = await lighthouse(
          `${origin}${page.path}`,
          {
            port: chrome.port,
            disableStorageReset: true,
            output: ['html', 'json'],
            onlyCategories: Object.keys(goals),
            logLevel: 'error',
          },
          profile.config,
        )
        if (!result) throw new Error(`Sem resultado em ${page.name} ${profile.name}`)
        samples.push(result)
        console.log(
          `${page.name} ${profile.name} ${run}: ${Object.keys(goals)
            .map((id) => `${labels[id]} ${score(result, id)}`)
            .join(', ')}`,
        )
      }

      const medians = Object.fromEntries(
        Object.keys(goals).map((id) => [id, median(samples.map((sample) => score(sample, id)))]),
      )
      const timing = {
        lcp: median(samples.map((sample) => metric(sample, 'largest-contentful-paint'))),
        cls: median(samples.map((sample) => metric(sample, 'cumulative-layout-shift'))),
        tbt: median(samples.map((sample) => metric(sample, 'total-blocking-time'))),
      }
      const failures = Object.values(samples[2].lhr.audits)
        .filter((audit) => audit.score !== null && audit.score < 1 && (audit.scoreDisplayMode ?? '') !== 'informative')
        .map((audit) => audit.title)
      const report = samples[1].report
      const [html, json] = Array.isArray(report) ? report : [null, report]
      rows.push({
        page: page.name,
        profile: profile.name,
        medians,
        timing,
        failures,
        html,
        json,
        version: samples[1].lhr.lighthouseVersion,
        environment: samples[1].lhr.environment,
      })
    }
  }

  const sample = rows[0]
  const lines = [
    '# Lighthouse',
    '',
    'Build de produção com os mocks. Três medições por página e perfil; os números abaixo são a mediana.',
    '',
    `Ferramenta: Lighthouse ${sample?.version ?? 'desconhecida'}.`,
    `Ambiente: ${sample?.environment?.hostUserAgent ?? 'não informado'}.`,
    `Rede: ${sample?.environment?.networkUserAgent ?? 'não informado'}.`,
    '',
    '| Página | Perfil | Performance | Acessibilidade | Boas práticas | SEO | LCP | CLS | TBT |',
    '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  ]
  for (const row of rows) {
    const lcp = `${(row.timing.lcp / 1000).toFixed(2)} s`
    const cls = row.timing.cls.toFixed(3)
    const tbt = `${Math.round(row.timing.tbt)} ms`
    lines.push(
      `| ${row.page} | ${row.profile} | ${row.medians.performance} | ${row.medians.accessibility} | ${row.medians['best-practices']} | ${row.medians.seo} | ${lcp} | ${cls} | ${tbt} |`,
    )
  }
  lines.push('', 'Metas: performance ≥ 90, acessibilidade ≥ 95, boas práticas ≥ 95, SEO ≥ 90.', '')
  lines.push('Os arquivos HTML e JSON de cada mediana estão nesta pasta.', '')

  const below = rows.filter((row) =>
    Object.entries(goals).some(([id, goal]) => row.medians[id] < goal),
  )
  if (below.length > 0) {
    lines.push('## Abaixo da meta', '')
    for (const row of below) {
      const gaps = Object.entries(goals)
        .filter(([id, goal]) => row.medians[id] < goal)
        .map(([id]) => labels[id])
        .join(', ')
      lines.push(`- ${row.page} ${row.profile}: ${gaps}`)
      for (const title of row.failures.slice(0, 8)) lines.push(`  - ${title}`)
    }
    lines.push('')
  }

  const reportDir = path.join(root, 'lighthouse')
  await mkdir(reportDir, { recursive: true })
  for (const row of rows) {
    const name = `${slug(row.page)}-${row.profile}`
    if (row.html) await writeFile(path.join(reportDir, `${name}.html`), row.html)
    if (row.json) await writeFile(path.join(reportDir, `${name}.json`), row.json)
  }
  await writeFile(path.join(reportDir, 'summary.md'), `${lines.join('\n')}\n`)
  console.log(lines.join('\n'))

  if (below.length > 0) process.exitCode = 1
} finally {
  await chrome?.kill()
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(preview.pid), '/t', '/f'], { stdio: 'ignore' })
  } else {
    preview.kill('SIGTERM')
  }
}
