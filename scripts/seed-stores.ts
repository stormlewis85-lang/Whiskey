/**
 * Seed liquor stores for beta testing of The Hunt feature.
 * Run with: npx tsx scripts/seed-stores.ts
 */
import 'dotenv/config';
import { Pool } from '@neondatabase/serverless';
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const STORES = [
  {
    name: "Total Wine & More",
    location: "Ann Arbor, MI",
    address: "3170 Lohr Rd, Ann Arbor, MI 48108",
    instagram_handle: "@totalwine",
    latitude: 42.2383,
    longitude: -83.7430,
  },
  {
    name: "Meijer Liquor",
    location: "Canton, MI",
    address: "45001 Ford Rd, Canton, MI 48187",
    instagram_handle: null,
    latitude: 42.3070,
    longitude: -83.4816,
  },
  {
    name: "Stadium Wine & Spirits",
    location: "Ann Arbor, MI",
    address: "1955 S Industrial Hwy, Ann Arbor, MI 48104",
    instagram_handle: null,
    latitude: 42.2586,
    longitude: -83.7345,
  },
  {
    name: "Village Corner",
    location: "Ann Arbor, MI",
    address: "601 S Forest Ave, Ann Arbor, MI 48104",
    instagram_handle: null,
    latitude: 42.2736,
    longitude: -83.7370,
  },
  {
    name: "Plum Market",
    location: "Ann Arbor, MI",
    address: "375 N Maple Rd, Ann Arbor, MI 48103",
    instagram_handle: "@plummarket",
    latitude: 42.2872,
    longitude: -83.7750,
  },
  {
    name: "Costco Liquor",
    location: "Livonia, MI",
    address: "13700 Middlebelt Rd, Livonia, MI 48150",
    instagram_handle: null,
    latitude: 42.3850,
    longitude: -83.3383,
  },
  {
    name: "Party City Wine & Spirits",
    location: "Dearborn, MI",
    address: "22385 Michigan Ave, Dearborn, MI 48124",
    instagram_handle: null,
    latitude: 42.3096,
    longitude: -83.2328,
  },
  {
    name: "Wine Palace",
    location: "Ypsilanti, MI",
    address: "1720 Washtenaw Ave, Ypsilanti, MI 48197",
    instagram_handle: null,
    latitude: 42.2458,
    longitude: -83.6208,
  },
];

async function main() {
  const client = await pool.connect();
  try {
    let inserted = 0;
    for (const store of STORES) {
      // Skip if already exists by name
      const existing = await client.query(
        `SELECT id FROM stores WHERE name = $1 LIMIT 1`,
        [store.name]
      );
      if (existing.rows.length > 0) {
        console.log(`  ⊘ ${store.name} already exists, skipping`);
        continue;
      }

      await client.query(
        `INSERT INTO stores (name, location, address, instagram_handle, latitude, longitude, is_verified)
         VALUES ($1, $2, $3, $4, $5, $6, true)`,
        [store.name, store.location, store.address, store.instagram_handle, store.latitude, store.longitude]
      );
      console.log(`  ✓ ${store.name}`);
      inserted++;
    }

    console.log(`\nSeeded ${inserted} new store(s) (${STORES.length - inserted} already existed).`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
