import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', timeout: 60000, use: { channel: process.env.CI ? undefined : 'chrome', baseURL: 'http://127.0.0.1:3182' },
  webServer: [
    { command: 'PYTHONPATH=services/ml AUTO_TRAIN_ON_STARTUP=false python3 -m uvicorn app.main:app --port 8182', url: 'http://127.0.0.1:8182/health', reuseExistingServer: !process.env.CI },
    { command: 'ML_URL=http://127.0.0.1:8182 pnpm --filter @fraudpulse/web exec next start -p 3182', url: 'http://127.0.0.1:3182/research', reuseExistingServer: !process.env.CI },
  ],
});
