import dotenv from "dotenv";
dotenv.config();

import { Pool } from '@neondatabase/serverless';

async function createAiUsageTable() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    console.log("Creating ai_usage_logs table...");

    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_usage_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        endpoint TEXT NOT NULL,
        whiskey_id INTEGER REFERENCES whiskeys(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log("ai_usage_logs table created successfully!");

    // Create index for faster rate limiting queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_ai_usage_user_date ON ai_usage_logs(user_id, created_at);
    `);

    console.log("Index created successfully!");

  } catch (error) {
    console.error("Error creating ai_usage_logs table:", error);
    throw error;
  } finally {
    client.release();
    process.exit(0);
  }
}

createAiUsageTable();
