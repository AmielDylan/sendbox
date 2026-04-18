import { defineConfig, devices } from '@playwright/test'
import * as fs from 'fs'
import * as dotenv from 'dotenv'
import * as path from 'path'

const envTestPath = path.resolve(__dirname, '.env.test')
const envTest = fs.existsSync(envTestPath)
  ? dotenv.parse(fs.readFileSync(envTestPath))
  : {}

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/globalSetup.ts',
  globalTeardown: './e2e/globalTeardown.ts',
  outputDir: '.playwright/results',
  reporter: [['html', { outputFolder: '.playwright/report', open: 'never' }], ['list']],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'next dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: envTest,
  },
})
