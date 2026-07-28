/**
 * All Supabase CRUD operations for the booking app.
 * Converts between DB types (snake_case, time with seconds) and app types.
 */

import { supabase } from "./supabase";
import type { Booking, Guest, Table } from "../pages/HomePage";

// ─── Time helpers ────────────────────────────────────────────────────────────

/** "19:30:00" → "19:30" */
function trimTime(t: string): string {
  return t.length === 8 ? t.slice(0, 5) : t;
}

/** "19:30" → "19:30:00" */
function padTime(t: string): string {
  return t.length === 5 ? t + ":00" : t;
}

// ─── Tables ──────────────────────────────────────────────────────────────────

export async function loadTables(): Promise<Table[]> {
  const { data, error } = await supabase
    .from("tables_config")
    .select("*")
    .order("id");

  if (error) throw new Error("loadTables: " + error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    seats: row.seats,
    status: row.status,
    blockReason: row.block_reason ?? undefined,
  }));
}

export async function blockTable(tableId: number): Promise<void> {
  const { error } = await supabase
    .from("tables_config")
    .update({ status: "blocked", block_reason: null })
    .eq("id", tableId);

  if (error) throw new Error("blockTable: " + error.message);
}

export async function unblockTable(tableId: number): Promise<void> {
  const { error } = await supabase
    .from("tables_config")
    .update({ status: "free", block_reason: null })
    .eq("id", tableId);

  if (error) throw new Error("unblockTable: " + error.message);
}

// ─── Guests ──────────────────────────────────────────────────────────────────

export async function loadGuests(): Promise<Guest[]> {
  const { data, error } = await supabase
    .from("guests")
    .select("*")
    .order("name");

  if (error) throw new Error("loadGuests: " + error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    tags: row.tags ?? [],
    comment: row.comment ?? "",
  }));
}

export async function upsertGuest(guest: Guest): Promise<Guest> {
  const { data, error } = await supabase
    .from("guests")
    .upsert(
      { name: guest.name, phone: guest.phone, tags: guest.tags, comment: guest.comment },
      { onConflict: "phone" }
    )
    .select()
    .single();

  if (error) throw new Error("upsertGuest: " + error.message);

  return { id: data.id, name: data.name, phone: data.phone, tags: data.tags ?? [], comment: data.comment ?? "" };
}

// ─── Bookings ────────────────────────────────────────────────────────────────

export async function loadBookings(): Promise<Booking[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .neq("status", "cancelled");

  if (error) throw new Error("loadBookings: " + error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    tableId: row.table_id,
    date: row.date,
    startTime: trimTime(row.start_time),
    endTime: trimTime(row.end_time),
    guests: row.guests_count,
    status: row.status,
    comment: row.guest_comment ?? "",
    guest: {
      name: row.guest_name,
      phone: row.guest_phone,
    },
  }));
}

export async function createBooking(booking: Omit<Booking, "id">): Promise<Booking> {
  const { data, error } = await supabase
    .from("bookings")
    .insert({
      table_id: booking.tableId,
      date: booking.date,
      start_time: padTime(booking.startTime),
      end_time: padTime(booking.endTime),
      guests_count: booking.guests,
      status: booking.status,
      guest_name: booking.guest.name,
      guest_phone: booking.guest.phone,
      guest_tags: [],
      guest_comment: booking.comment,
    })
    .select()
    .single();

  if (error) throw new Error("createBooking: " + error.message);

  return {
    id: data.id,
    tableId: data.table_id,
    date: data.date,
    startTime: trimTime(data.start_time),
    endTime: trimTime(data.end_time),
    guests: data.guests_count,
    status: data.status,
    comment: data.guest_comment ?? "",
    guest: {
      name: data.guest_name,
      phone: data.guest_phone,
    },
  };
}

export async function updateBooking(booking: Booking): Promise<void> {
  const { error } = await supabase
    .from("bookings")
    .update({
      table_id: booking.tableId,
      date: booking.date,
      start_time: padTime(booking.startTime),
      end_time: padTime(booking.endTime),
      guests_count: booking.guests,
      status: booking.status,
      guest_name: booking.guest.name,
      guest_phone: booking.guest.phone,
      guest_tags: [],
      guest_comment: booking.comment,
    })
    .eq("id", booking.id);

  if (error) throw new Error("updateBooking: " + error.message);
}

export async function deleteBooking(bookingId: number): Promise<void> {
  const { error } = await supabase
    .from("bookings")
    .delete()
    .eq("id", bookingId);

  if (error) throw new Error("deleteBooking: " + error.message);
}
