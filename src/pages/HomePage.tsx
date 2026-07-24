import { useCallback, useMemo, useState } from "react";

import BookingModal from "../components/BookingModal";
import DateTimePopover from "../components/DateTimePopover";
import FloorPlan, { initialFloorTables } from "../components/FloorPlan";
import TablePanel from "../components/TablePanel";

export type TableStatus =
    | "free"
    | "soon"
    | "reserved"
    | "blocked";

export type Table = {
    id: number;
    seats: number;
    status: TableStatus;
    blockReason?: string;
};

export type BookingStatus =
    | "reserved"
    | "seated"
    | "completed"
    | "cancelled";

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
    const [tables, setTables] = useState<Table[]>(initialFloorTables);
    const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

    const [guestsDirectory, setGuestsDirectory] = useState<Guest[]>([
        {
            id: 1,
            name: "Виталя",
            phone: "+79999999999",
            tags: ["Постоянный"],
            comment: "Любит блэк шип",
        },
    ]);

    const [bookings, setBookings] = useState<Booking[]>([
        {
            id: 1,
            tableId: 13,
            date: todayString(),
            startTime: "19:30",
            endTime: "21:00",
            guests: 4,
            status: "reserved",
            guest: {
                name: "Виталя",
                phone: "+79999999999",
                tags: ["Постоянный"],
                comment: "Любит блэк шип",
            },
        },
    ]);

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

            if (isBookingOpen) {
                setBookingTable(table);
            }
        },
        [isBookingOpen]
    );

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

            <main className="grid h-[calc(100vh-80px)] grid-cols-[1fr_440px]">
                <section className="relative overflow-hidden">
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
                        onCreate={(booking, guest) => {
                            setBookings((currentBookings) => [
                                ...currentBookings,
                                {
                                    ...booking,
                                    id: Date.now(),
                                },
                            ]);

                            setGuestsDirectory((currentGuests) => {
                                const exists = currentGuests.some(
                                    (currentGuest) => currentGuest.phone === guest.phone
                                );

                                return exists ? currentGuests : [...currentGuests, guest];
                            });

                            const nextSelectedTable =
                                tables.find((table) => table.id === booking.tableId) ?? null;

                            setSelectedDate(booking.date);
                            setSelectedTime(booking.startTime);
                            setSelectedTable(nextSelectedTable);
                            closeBooking();
                        }}
                        onDelete={(bookingId) => {
                            setBookings((current) =>
                                current.filter((b) => b.id !== bookingId)
                            );
                        }}
                        onUpdate={(booking, guest) => {
                            setBookings((currentBookings) =>
                                currentBookings.map((currentBooking) =>
                                    currentBooking.id === booking.id ? booking : currentBooking
                                )
                            );

                            setGuestsDirectory((currentGuests) => {
                                const exists = currentGuests.some(
                                    (currentGuest) => currentGuest.phone === guest.phone
                                );

                                return exists
                                    ? currentGuests.map((currentGuest) =>
                                          currentGuest.phone === guest.phone
                                              ? {
                                                    ...currentGuest,
                                                    name: guest.name,
                                                    tags: guest.tags,
                                                    comment: guest.comment,
                                                }
                                              : currentGuest
                                      )
                                    : [...currentGuests, guest];
                            });

                            const nextSelectedTable =
                                tables.find((table) => table.id === booking.tableId) ?? null;

                            setSelectedDate(booking.date);
                            setSelectedTime(booking.startTime);
                            setSelectedTable(nextSelectedTable);
                            closeBooking();
                        }}
                    />
                ) : (
                    <TablePanel
                        table={selectedTable}
                        bookings={bookings}
                        selectedDate={selectedDate}
                        onClose={() => setSelectedTable(null)}
                        onEditBooking={(booking) => {
                            const table =
                                tables.find((currentTable) => currentTable.id === booking.tableId) ??
                                null;

                            setSelectedTable(table);
                            setBookingTable(table);
                            setEditingBooking(booking);
                            setIsBookingOpen(true);
                        }}
                        onBlockTable={(tableId, reason) => {
                            setTables((currentTables) =>
                                currentTables.map((table) =>
                                    table.id === tableId
                                        ? {
                                              ...table,
                                              status: "blocked",
                                              blockReason: reason,
                                          }
                                        : table
                                )
                            );
                            setSelectedTable((currentTable) =>
                                currentTable?.id === tableId
                                    ? {
                                          ...currentTable,
                                          status: "blocked",
                                          blockReason: reason,
                                      }
                                    : currentTable
                            );
                        }}
                        onUnblockTable={(tableId) => {
                            setTables((currentTables) =>
                                currentTables.map((table) =>
                                    table.id === tableId
                                        ? {
                                              id: table.id,
                                              seats: table.seats,
                                              status: "free",
                                          }
                                        : table
                                )
                            );
                            setSelectedTable((currentTable) =>
                                currentTable?.id === tableId
                                    ? {
                                          id: currentTable.id,
                                          seats: currentTable.seats,
                                          status: "free",
                                      }
                                    : currentTable
                            );
                        }}
                    />
                )}
            </main>

            {!isBookingOpen && (
                <button
                    type="button"
                    onClick={openBooking}
                    className="
                        fixed bottom-8 right-8 z-40 rounded-2xl bg-[#D7A441]
                        min-w-80 px-12 py-4 text-lg font-semibold text-black shadow-xl
                        transition hover:bg-[#e0b45d]
                    "
                >
                    Новая бронь
                </button>
            )}

        </div>
    );
}
