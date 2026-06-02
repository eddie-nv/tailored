#!/usr/bin/env bash
set -euo pipefail

echo "==> Installing dependencies..."
pnpm install

echo "==> Running database migrations..."
pnpm db:migrate

echo "==> Seeding the database..."
pnpm db:seed

echo "==> Installing Playwright Chromium (needed for PDF resume generation)..."
npx playwright install chromium

echo ""
echo "Setup complete. Run 'pnpm dev' to start the app at http://localhost:3000"
