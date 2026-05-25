#!/usr/bin/env node
// update-coins.js
//
// Fetches the top meme-category tokens from CoinGecko and writes meme-coins.json.
// Runs on Node 18+ using the built-in global fetch — no external dependencies.
//
// This file must live in the REPO ROOT (next to meme-coins.json), because the
// workflow runs `node update-coins.js` with no path and then `git add meme-coins.json`.
//
// Optional but recommended: set a free CoinGecko *Demo* API key as the
// COINGECKO_API_KEY env var. GitHub's runners share datacenter IPs, and the
// keyless public API throttles those hard (≈5–15 calls/min), which is the usual
// reason this works locally but 429s in CI. A demo key gives a stable limit.
// In GitHub: Settings → Secrets and variables → Actions → New repository secret.

'use strict';

const fs = require('fs/promises');
const path = require('path');

const OUT_FILE = path.join(__dirname, 'meme-coins.json');
const PER_PAGE = 50;
const MAX_RETRIES = 5;

// A demo key works against the public host via the x-cg-demo-api-key header.
const API_KEY = process.env.COINGECKO_API_KEY || process.env.COINGECKO_DEMO_KEY || '';
const BASE = 'https://api.coingecko.com/api/v3/coins/markets';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function buildUrl() {
  const params = new URLSearchParams({
    vs_currency: 'usd',
    category: 'meme-token',
    order: 'market_cap_desc',
    per_page: String(PER_PAGE),
    page: '1',
    price_change_percentage: '24h',
  });
  return `${BASE}?${params.toString()}`;
}

async function fetchMarkets() {
  const url = buildUrl();
  const headers = { accept: 'application/json' };
  if (API_KEY) headers['x-cg-demo-api-key'] = API_KEY;

  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    let res;
    try {
      res = await fetch(url, { headers });
    } catch (err) {
      // Network-level failure (DNS, socket). Retry.
      lastErr = err;
      const wait = Math.min(2000 * 2 ** (attempt - 1), 30000);
      console.warn(`Attempt ${attempt}: network error (${err.message}). Retrying in ${wait}ms.`);
      await sleep(wait);
      continue;
    }

    if (res.ok) {
      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error(
          `Expected a JSON array, got ${typeof data}: ${JSON.stringify(data).slice(0, 200)}`
        );
      }
      if (data.length === 0) {
        throw new Error('CoinGecko returned an empty array — refusing to overwrite with no coins.');
      }
      return data;
    }

    // Read a snippet of the error body so the Actions log actually tells you what happened.
    const body = await res.text().catch(() => '');
    lastErr = new Error(`HTTP ${res.status} ${res.statusText} — ${body.slice(0, 200)}`);

    // 429 (rate limit) and 5xx are transient — back off and retry.
    // 4xx (e.g. a bad API key) is not, so fail fast.
    if (res.status === 429 || res.status >= 500) {
      const retryAfter = Number(res.headers.get('retry-after'));
      const wait = retryAfter > 0 ? retryAfter * 1000 : Math.min(2000 * 2 ** (attempt - 1), 30000);
      console.warn(`Attempt ${attempt}: ${lastErr.message}. Retrying in ${wait}ms.`);
      await sleep(wait);
      continue;
    }

    throw lastErr;
  }
  throw lastErr || new Error('Failed to fetch markets after retries.');
}

function shape(markets) {
  return markets.map((c) => ({
    id: c.id,
    name: c.name,
    symbol: (c.symbol || '').toUpperCase(),
    image: c.image,
    price: c.current_price,
    volume_24h: c.total_volume,
    market_cap: c.market_cap,
    price_change_24h_pct: c.price_change_percentage_24h,
  }));
}

async function main() {
  const markets = await fetchMarkets();
  const payload = {
    updated_at: new Date().toISOString(),
    source: 'coingecko.com/api/v3/coins/markets?category=meme-token',
    note: 'Top 50 meme-category tokens by market cap from CoinGecko.',
    coins: shape(markets),
  };
  await fs.writeFile(OUT_FILE, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${payload.coins.length} coins to ${OUT_FILE}`);
}

main().catch((err) => {
  // Print a clean message AND exit non-zero so the workflow reports failure correctly.
  console.error('update-coins.js failed:', err.message);
  process.exitCode = 1;
});