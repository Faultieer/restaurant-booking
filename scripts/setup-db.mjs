/**
 * One-time DB setup script — creates tables in Supabase if they don't exist.
 * Run with: VITE_SUPABASE_URL=... VITE_SUPABASE_KEY=... node scripts/setup-db.mjs
 */
import { createClient } from "@supabase/supabase-js";
import ws from "ws";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_KEY;

if (!url || !key) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, {
  realtime: { transport: ws },
});

// Test connection
const { error: pingErr } = await supabase.from("guests").select("id").limit(1);
const tablesExist = !pingErr || !pingErr.message.includes("does not exist");

if (tablesExist && !pingErr) {
  console.log("✅ Tables already exist, skipping creation");
  process.exit(0);
}

console.log("Creating tables via Supabase sql tag...");

// supabase.sql is available in SDK >= 2.46
const { error } = await supabase.sql`
  CREATE TABLE IF NOT EXISTS guests (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name text NOT NULL,
    phone text NOT NULL UNIQUE,
    tags text[] NOT NULL DEFAULT '{}',
    comment text NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS tables_config (
    id int PRIMARY KEY,
    seats int NOT NULL,
    status text NOT NULL DEFAULT 'free' CHECK (status IN ('free','blocked')),
    block_reason text
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    table_id int NOT NULL REFERENCES tables_config(id),
    date date NOT NULL,
    start_time time NOT NULL,
    end_time time NOT NULL,
    guests_count int NOT NULL,
    status text NOT NULL DEFAULT 'reserved'
      CHECK (status IN ('reserved','seated','completed','cancelled')),
    guest_name text NOT NULL,
    guest_phone text NOT NULL,
    guest_tags text[] NOT NULL DEFAULT '{}',
    guest_comment text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now()
  );

  -- Initial tables for the restaurant floor (mirrors initialFloorTables in code)
  INSERT INTO tables_config (id, seats, status) VALUES
    (11, 4, 'free'), (12, 4, 'free'), (10, 4, 'free'), (13, 4, 'free'),
    (9, 4, 'free'),  (6, 4, 'free'),  (8, 4, 'free'),  (7, 4, 'free'),
    (5, 6, 'free'),  (4, 6, 'free'),  (1, 4, 'free'),
    (2, 2, 'blocked'), (3, 4, 'free')
  ON CONFLICT (id) DO NOTHING;
`;

if (error) {
  console.error("❌ sql tag failed:", error.message);

  // Fallback: try via rpc if sql tag is unsupported
  console.log("Trying rpc fallback...");
  const { error: rpcErr } = await supabase.rpc("exec_sql", {
    query: "SELECT 1"
  });
  console.log("rpc fallback error:", rpcErr?.message ?? "none (rpc exists)");
  process.exit(1);
} else {
  console.log("✅ Tables created successfully");
  process.exit(0);
}
