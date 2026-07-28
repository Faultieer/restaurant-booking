import { useCallback, useEffect, useMemo, useState } from "react";

import BookingModal from "../components/BookingModal";
import DateTimePopover from "../components/DateTimePopover";
import FloorPlan, { initialFloorTables } from "../components/FloorPlan";
import TablePanel from "../components/TablePanel";
import {
  blockTable,
  createBooking,
  deleteBooking,
  loadBookings,
  loadGuests,
  loadTables,
  unblockTable,
  updateBooking,
  upsertGuest,
} from "../lib/db";

export type TableStatus = "free" | "soon" | "reserved" | "blocked";

export type Table = {
  id: number;
  seats: number;
  status: TableStatus;
  blockReason?: string;
};

export type BookingStatus = "reserved" | "seated" | "completed" | "cancelled";

export type Guest = {
  id: number;
  name: string;
  phone: string;
  tags: string[];
  comment: string;
};

export type Booking = {
  id: number;
  tableId: number;
  date: string;
  startTime: string;
  endTime: string;
  guests: number;
  status: BookingStatus;
  comment: string;
  guest: {
    name: string;
    phone: string;
  };
};

type BookingDraft = {
  date: string;
  time: string;
  durationMinutes: number;
  guests: number;
};

function todayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    weekday: "short",
  }).format(new Date(`${value}T00:00:00`));
}

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [selectedTime, setSelectedTime] = useState("19:30");
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [bookingTable, setBookingTable] = useState<Table | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [bookingDraft, setBookingDraft] = useState<BookingDraft | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  // ─── Data state ────────────────────────────────────────────────────────────
  const [tables, setTables] = useState<Table[]>(initialFloorTables);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [guestsDirectory, setGuestsDirectory] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // ─── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const [dbTables, dbBookings, dbGuests] = await Promise.all([
          loadTables(),
          loadBookings(),
          loadGuests(),
        ]);
        if (cancelled) return;
        setTables(dbTables);
        setBookings(dbBookings);
        setGuestsDirectory(dbGuests);
        setDbError(null);
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setDbError(err instanceof Error ? err.message : "Ошибка загрузки данных");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  const headerDate = useMemo(() => formatDate(selectedDate), [selectedDate]);

  const openBooking = useCallback(() => {
    setEditingBooking(null);
    setBookingTable(selectedTable);
    setIsBookingOpen(true);
  }, [selectedTable]);

  const closeBooking = useCallback(() => {
    setIsBookingOpen(false);
    setBookingDraft(null);
    setBookingTable(null);
    setEditingBooking(null);
  }, []);

  const selectTable = useCallback(
    (table: Table) => {
      setSelectedTable(table);
      if (isBookingOpen) setBookingTable(table);
    },
    [isBookingOpen]
  );

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const handleCreate = useCallback(
    async (bookingData: Omit<Booking, "id">, guest: { id?: number; name: string; phone: string; tags: string[]; comment: string }) => {
      try {
        // Walk-in: no guest contact info — skip upsert
        const isWalkIn = !guest.phone.trim();
        const savedGuest = isWalkIn
          ? { id: 0, name: "", phone: "", tags: [], comment: "" }
          : await upsertGuest({ id: guest.id ?? 0, ...guest });

        const saved = await createBooking({ ...bookingData, guest: savedGuest });

        setBookings((prev) => [...prev, saved]);
        if (!isWalkIn) {
          setGuestsDirectory((prev) => {
            const exists = prev.some((g) => g.phone === savedGuest.phone);
            return exists
              ? prev.map((g) => g.phone === savedGuest.phone ? savedGuest : g)
              : [...prev, savedGuest];
          });
        }

        const nextTable = tables.find((t) => t.id === saved.tableId) ?? null;
        setSelectedDate(saved.date);
        setSelectedTime(saved.startTime);
        setSelectedTable(nextTable);
        closeBooking();
      } catch (err) {
        alert("Ошибка сохранения: " + (err instanceof Error ? err.message : err));
      }
    },
    [tables, closeBooking]
  );

  const handleUpdate = useCallback(
    async (booking: Booking, guest: { id?: number; name: string; phone: string; tags: string[]; comment: string }) => {
      try {
        const savedGuest = await upsertGuest({ id: guest.id ?? 0, ...guest });
        const updated: Booking = { ...booking, guest: savedGuest };
        await updateBooking(updated);

        setBookings((prev) => prev.map((b) => b.id === updated.id ? updated : b));
        setGuestsDirectory((prev) => {
          const exists = prev.some((g) => g.phone === savedGuest.phone);
          return exists
            ? prev.map((g) => g.phone === savedGuest.phone ? savedGuest : g)
            : [...prev, savedGuest];
        });

        const nextTable = tables.find((t) => t.id === updated.tableId) ?? null;
        setSelectedDate(updated.date);
        setSelectedTime(updated.startTime);
        setSelectedTable(nextTable);
        closeBooking();
      } catch (err) {
        alert("Ошибка обновления: " + (err instanceof Error ? err.message : err));
      }
    },
    [tables, closeBooking]
  );

  const handleDelete = useCallback(async (bookingId: number) => {
    try {
      await deleteBooking(bookingId);
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    } catch (err) {
      alert("Ошибка удаления: " + (err instanceof Error ? err.message : err));
    }
  }, []);

  const handleBlockTable = useCallback(async (tableId: number) => {
    try {
      await blockTable(tableId);
      const update = (t: Table): Table =>
        t.id === tableId ? { ...t, status: "blocked", blockReason: undefined } : t;
      setTables((prev) => prev.map(update));
      setSelectedTable((prev) => prev?.id === tableId ? update(prev) : prev);
    } catch (err) {
      alert("Ошибка блокировки: " + (err instanceof Error ? err.message : err));
    }
  }, []);

  const handleUnblockTable = useCallback(async (tableId: number) => {
    try {
      await unblockTable(tableId);
      const update = (t: Table): Table =>
        t.id === tableId ? { id: t.id, seats: t.seats, status: "free" } : t;
      setTables((prev) => prev.map(update));
      setSelectedTable((prev) => prev?.id === tableId ? update(prev) : prev);
    } catch (err) {
      alert("Ошибка разблокировки: " + (err instanceof Error ? err.message : err));
    }
  }, []);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#10211D] text-white">
      <header className="shrink-0 border-b border-white/10">
        {/* Основная строка */}
        <div className="relative flex h-16 items-center justify-between px-4 md:h-20 md:px-8">
          <div className="flex items-center gap-3">
            <img
              src="/logo.jpg"
              alt="Гусь и Огурчик"
              className="h-10 w-10 rounded-xl object-cover md:h-12 md:w-12 md:rounded-2xl"
            />
            <div>
              <h1 className="text-base font-semibold md:text-xl">Гусь и Огурчик</h1>
              <p className="text-xs text-white/50 md:text-sm">Система бронирования</p>
            </div>
          </div>

          {/* Кнопка выбора даты — только на desktop в центре */}
          <div className="absolute left-1/2 -translate-x-1/2 hidden md:block">
            <button
              type="button"
              onClick={() => setIsDatePickerOpen(true)}
              className="rounded-xl bg-white/10 px-6 py-3 transition hover:bg-white/15"
            >
              <span className="capitalize">{headerDate}</span>
              <span className="ml-3 text-white/50">{selectedTime}</span>
            </button>
          </div>

          {/* DB status indicator */}
          {!loading && (
            <div className={`h-2 w-2 rounded-full ${dbError ? "bg-[#D25A5A]" : "bg-[#4DB980]"}`}
              title={dbError ?? "Supabase подключён"} />
          )}
        </div>

        {/* Кнопка выбора даты — только на mobile, отдельная строка */}
        <div className="flex justify-center pb-3 md:hidden">
          <button
            type="button"
            onClick={() => setIsDatePickerOpen(true)}
            className="rounded-xl bg-white/10 px-6 py-2.5 text-sm transition hover:bg-white/15"
          >
            <span className="capitalize">{headerDate}</span>
            <span className="ml-3 text-white/50">{selectedTime}</span>
          </button>
        </div>
      </header>

      <DateTimePopover
        open={isDatePickerOpen}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        onClose={() => setIsDatePickerOpen(false)}
        onApply={(date, time) => {
          setSelectedDate(date);
          setSelectedTime(time);
        }}
      />

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10211D]/80">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[#D7A441]" />
            <p className="text-sm text-white/50">Загружаем данные…</p>
          </div>
        </div>
      )}

      {/* DB error banner */}
      {dbError && !loading && (
        <div className="border-b border-[#D25A5A]/30 bg-[#D25A5A]/10 px-8 py-3 text-sm text-[#D25A5A]">
          Ошибка Supabase: {dbError}
        </div>
      )}

      <main className="relative flex flex-1 flex-col overflow-hidden md:grid md:grid-cols-[1fr_500px] xl:grid-cols-[1fr_560px] 2xl:grid-cols-[1fr_640px]">
        <section className="relative min-h-0 flex-1 overflow-hidden md:h-full">
          <FloorPlan
            tables={tables}
            bookings={bookings}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            bookingDraft={isBookingOpen ? bookingDraft : null}
            onSelectTable={selectTable}
            selectedTableId={selectedTable?.id}
            bookingTableId={bookingTable?.id}
          />
        </section>

        {/* Mobile backdrop — только когда открыта панель стола (не бронь),
            чтобы при открытой форме брони план зала оставался тапабельным */}
        {selectedTable && !isBookingOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setSelectedTable(null)}
          />
        )}

        {isBookingOpen ? (
          <BookingModal
            open={isBookingOpen}
            table={bookingTable}
            booking={editingBooking}
            bookings={bookings}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            guestsDirectory={guestsDirectory}
            onClose={closeBooking}
            onDraftChange={setBookingDraft}
            onCreate={(booking, guest) => handleCreate(booking, guest)}
            onDelete={handleDelete}
            onUpdate={(booking, guest) => handleUpdate(booking, guest)}
          />
        ) : (
          <TablePanel
            table={selectedTable}
            bookings={bookings}
            selectedDate={selectedDate}
            onClose={() => setSelectedTable(null)}
            onBook={openBooking}
            onEditBooking={(booking) => {
              const table = tables.find((t) => t.id === booking.tableId) ?? null;
              setSelectedTable(table);
              setBookingTable(table);
              setEditingBooking(booking);
              setIsBookingOpen(true);
            }}
            onBlockTable={(tableId) => handleBlockTable(tableId)}
            onUnblockTable={handleUnblockTable}
          />
        )}
      </main>

      {/* Mobile: статичная кнопка под планом зала */}
      {!isBookingOpen && !selectedTable && (
        <div className="shrink-0 border-t border-white/10 p-4 pb-safe-4 md:hidden">
          <button
            type="button"
            onClick={openBooking}
            className="w-full rounded-2xl bg-[#D7A441] py-4 text-base font-semibold text-black shadow-xl transition hover:bg-[#e0b45d] active:scale-[.98]"
          >
            Новая бронь
          </button>
        </div>
      )}

      {/* Desktop: fixed кнопка */}
      {!isBookingOpen && (
        <button
          type="button"
          onClick={openBooking}
          className="hidden md:block fixed z-40 rounded-2xl bg-[#D7A441] font-semibold text-black shadow-xl transition hover:bg-[#e0b45d] active:scale-[.98] bottom-8 right-8 min-w-80 px-12 py-4 text-lg"
        >
          Новая бронь
        </button>
      )}
    </div>
  );
}
