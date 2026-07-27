import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_KEY env vars");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Types matching DB schema ────────────────────────────────────────────────

export type DbGuest = {
  id: number;
  name: string;
  phone: string;
  tags: string[];
  comment: string;
};

export type DbTable = {
  id: number;
  seats: number;
  status: "free" | "blocked";
  block_reason: string | null;
};

export type DbBooking = {
  id: number;
  table_id: number;
  date: string;           // "YYYY-MM-DD"
  start_time: string;     // "HH:MM:SS"
  end_time: string;
  guests_count: number;
  status: "reserved" | "seated" | "completed" | "cancelled";
  guest_name: string;
  guest_phone: string;
  guest_tags: string[];
  guest_comment: string;
  created_at: string;
};
