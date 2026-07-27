# Гусь и Огурчик — Система бронирования

Restaurant table booking app for "Гусь и Огурчик".

## Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL + RLS)
- **Key libs**: react-day-picker, react-mobile-picker

## Running the app

```
npm run dev
```

Starts Vite dev server on port **5173**.

## Required environment variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_KEY` | Supabase anon/publishable key |

Both are set in Replit shared environment.

## Supabase schema

Three tables: `guests`, `tables_config`, `bookings`.  
RLS is enabled with permissive `allow_all_*` policies for the anon key (internal tool).  
Tables are pre-seeded (13 tables, IDs 1–13).

## Project structure

```
src/
  components/   # BookingModal, FloorPlan, Table, TablePanel, DateTimePopover, TimeWheel
  pages/        # HomePage
  lib/          # supabase.ts (client + types), db.ts (queries)
  styles/       # theme.css
```

## User preferences

- Keep existing project structure and stack.
