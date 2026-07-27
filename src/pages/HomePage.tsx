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
  guest: {
    name: string;
    phone: string;
    tags: string[];
    comment: string;
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
        // Upsert guest first, then create booking
        const savedGuest = await upsertGuest({ id: guest.id ?? 0, ...guest });
        const saved = await createBooking({ ...bookingData, guest: savedGuest });

        setBookings((prev) => [...prev, saved]);
        setGuestsDirectory((prev) => {
          const exists = prev.some((g) => g.phone === savedGuest.phone);
          return exists
            ? prev.map((g) => g.phone === savedGuest.phone ? savedGuest : g)
            : [...prev, savedGuest];
        });

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
    <div className="h-screen overflow-hidden bg-[#10211D] text-white">
      <header className="relative flex h-20 items-center justify-between border-b border-white/10 px-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D7A441] text-xl font-bold text-black">
            G
          </div>
          <div>
            <h1 className="text-xl font-semibold">Гусь и Огурчик</h1>
            <p className="text-sm text-white/50">Система бронирования</p>
          </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2">
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

      <main className="relative h-[calc(100vh-80px)] md:grid md:grid-cols-[1fr_500px] xl:grid-cols-[1fr_560px] 2xl:grid-cols-[1fr_640px]">
        <section className="relative h-full overflow-auto md:overflow-hidden">
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

        {/* Mobile backdrop */}
        {(isBookingOpen || selectedTable) && (
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => {
              if (isBookingOpen) closeBooking();
              else setSelectedTable(null);
            }}
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

      {!isBookingOpen && (
        <button
          type="button"
          onClick={openBooking}
          className={[
            "fixed z-40 rounded-2xl bg-[#D7A441] font-semibold text-black shadow-xl",
            "transition hover:bg-[#e0b45d] active:scale-[.98]",
            "bottom-safe-4 left-4 right-4 py-4 text-base",
            "md:bottom-8 md:left-auto md:right-8 md:min-w-80 md:px-12 md:py-4 md:text-lg",
            selectedTable ? "hidden md:block" : "",
          ].join(" ")}
        >
          Новая бронь
        </button>
      )}
    </div>
  );
}
