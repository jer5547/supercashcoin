// update-coins.js
// Fetches the top 50 meme coins from CoinGecko and writes meme-coins.json
// Run via GitHub Actions (see .github/workflows/update-coins.yml) or manually:
//   node update-coins.js

const fs = require('fs');

const URL =
  'https://api.coingecko.com/api/v3/coins/markets' +
  '?vs_currency=usd' +
  '&category=meme-token' +
  '&order=volume_desc' +    // sorted by 24h trading volume
  '&per_page=50' +          // grab top 50 meme coins
  '&page=1' +
  '&sparkline=false';

(async () => {
  let raw;
  try {
    const res = await fetch(URL, {
      headers: { 'accept': 'application/json' }
    });
    if (!res.ok) {
      throw new Error(`CoinGecko returned ${res.status}`);
    }
    raw = await res.json();
  } catch (err) {
    console.error('Fetch failed:', err.message);
    process.exit(1);
  }

  if (!Array.isArray(raw) || raw.length === 0) {
    console.error('Unexpected response from CoinGecko');
    process.exit(1);
  }

  // Take the top 50 (or whatever CoinGecko returned, if fewer), normalize fields
  const coins = raw.slice(0, 50).map(c => ({
    id: c.id,
    name: c.name,
    symbol: (c.symbol || '').toUpperCase(),
    image: c.image,
    price: c.current_price,
    volume_24h: c.total_volume,
    market_cap: c.market_cap,
    price_change_24h_pct: c.price_change_percentage_24h
  }));

  const out = {
    updated_at: new Date().toISOString(),
    source: 'coingecko.com/api/v3/coins/markets?category=meme-token',
    note: 'Estimated buys = volume_24h * 0.5; rewards @ 25% applied client-side',
    coins
  };

  fs.writeFileSync('meme-coins.json', JSON.stringify(out, null, 2));
  console.log(`Wrote ${coins.length} coins to meme-coins.json`);
  coins.forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.name} (${c.symbol}) - $${(c.volume_24h / 1e6).toFixed(2)}M volume`);
  });
})();