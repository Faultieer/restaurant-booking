import { useState } from "react";

import type { Booking, Table } from "../pages/HomePage";

type TablePanelProps = {
    table: Table | null;
    bookings: Booking[];
    selectedDate: string;
    onClose: () => void;
    onBook: () => void;
    onEditBooking: (booking: Booking) => void;
    onBlockTable: (tableId: number) => void;
    onUnblockTable: (tableId: number) => void;
};

type ScheduleItem =
    | {
          status: "free";
          startTime: string;
          endTime: string;
      }
    | {
          status: "booking";
          startTime: string;
          endTime: string;
          booking: Booking;
      };

const dayStart = "13:00";
const dayEnd = "24:00";

function timeToMinutes(time: string) {
    if (time === "24:00") return 1440;

    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
}

function minutesToTime(minutes: number) {
    if (minutes === 1440) return "24:00";

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function getStatusLabel(status: Booking["status"]) {
    const labels = {
        reserved: "Забронировано",
        seated: "Забронировано",
        completed: "Завершено",
        cancelled: "Отменено",
    };

    return labels[status];
}

function generateSchedule(tableId: number, bookings: Booking[], date: string): ScheduleItem[] {
    const tableBookings = bookings
        .filter((booking) => booking.tableId === tableId && booking.date === date)
        .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    const result: ScheduleItem[] = [];
    let current = timeToMinutes(dayStart);
    const end = timeToMinutes(dayEnd);

    tableBookings.forEach((booking) => {
        const bookingStart = timeToMinutes(booking.startTime);
        const bookingEnd = timeToMinutes(booking.endTime);

        if (current < bookingStart) {
            result.push({
                status: "free",
                startTime: minutesToTime(current),
                endTime: booking.startTime,
            });
        }

        result.push({
            status: "booking",
            startTime: booking.startTime,
            endTime: booking.endTime,
            booking,
        });

        current = Math.max(current, bookingEnd);
    });

    if (current < end) {
        result.push({
            status: "free",
            startTime: minutesToTime(current),
            endTime: dayEnd,
        });
    }

    return result;
}

export default function TablePanel({
    table,
    bookings,
    selectedDate,
    onClose,
    onBook,
    onEditBooking,
    onBlockTable,
    onUnblockTable,
}: TablePanelProps) {
    const [isBlockOpen, setIsBlockOpen] = useState(false);

    if (!table) {
        return (
            // Empty state — visible only on desktop (mobile shows nothing when no table selected)
            <aside className="hidden md:block h-full border-l border-white/10 bg-[#10211D] p-6 text-white">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <h2 className="text-lg font-semibold">Стол не выбран</h2>
                    <p className="mt-2 text-sm text-white/50">
                        Нажмите на стол, чтобы посмотреть бронирования за выбранную дату.
                    </p>
                </div>
            </aside>
        );
    }

    const schedule = generateSchedule(table.id, bookings, selectedDate);

    return (
        <aside className="
            fixed inset-0 z-50 overflow-y-auto bg-[#10211D] text-white
            md:static md:inset-auto md:z-auto md:h-full md:max-h-none
            md:rounded-none md:border-t-0 md:border-l md:border-white/10
        ">
            <div className="p-6 pb-safe-4 md:p-6 md:pb-6">
            {/* Кнопка «Назад» — только на мобиле */}
            <button
                type="button"
                onClick={onClose}
                className="mb-4 flex items-center gap-2 text-sm text-white/60 transition hover:text-white md:hidden"
                aria-label="Назад"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                </svg>
                Назад
            </button>

            <div className="flex justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Стол №{table.id}</h2>
                    <p className="mt-2 text-white/50">{table.seats} мест</p>
                    {table.status === "blocked" && (
                        <p className="mt-2 rounded-xl bg-[#D25A5A]/20 px-3 py-2 text-sm text-[#D25A5A]">
                            Стол заблокирован
                        </p>
                    )}
                </div>

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setIsBlockOpen((current) => !current)}
                        className={`
                            flex h-12 w-12 items-center justify-center rounded-xl text-xl transition
                            ${table.status === "blocked"
                                ? "bg-[#D25A5A] text-white"
                                : "bg-white/10 text-white hover:bg-white/15"}
                        `}
                        aria-label="Блокировка стола"
                        title="Блокировка стола"
                    >
                        🔒
                    </button>

                    {/* Кнопка закрытия — только на desktop */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="hidden md:flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-xl transition hover:bg-white/15"
                        aria-label="Закрыть карточку стола"
                    >
                        ×
                    </button>
                </div>
            </div>

            <div className="mt-4 capitalize text-white/50">
                {new Intl.DateTimeFormat("ru-RU", {
                    day: "numeric",
                    month: "long",
                    weekday: "short",
                }).format(new Date(`${selectedDate}T00:00:00`))}
            </div>

            <div className="my-5 h-px bg-white/10" />

            {isBlockOpen && (
                <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                    {table.status === "blocked" ? (
                        <button
                            type="button"
                            onClick={() => {
                                onUnblockTable(table.id);
                                setIsBlockOpen(false);
                            }}
                            className="h-12 w-full rounded-xl bg-white/10 px-4 font-semibold transition hover:bg-white/15"
                        >
                            Снять блокировку
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => {
                                onBlockTable(table.id);
                                setIsBlockOpen(false);
                            }}
                            className="h-12 w-full rounded-xl bg-[#D25A5A] px-4 font-semibold text-white transition hover:bg-[#df6b6b]"
                        >
                            Заблокировать стол
                        </button>
                    )}
                </div>
            )}

            <div className="space-y-3">
                {schedule.map((item, index) =>
                    item.status === "free" ? (
                        <div key={`${item.startTime}-${index}`} className="rounded-xl bg-white/5 p-4">
                            <div className="font-semibold">
                                {item.startTime}–{item.endTime}
                            </div>
                            <p className="mt-2 font-semibold text-[#4DB980]">Свободно</p>
                        </div>
                    ) : (
                        <button
                            key={item.booking.id}
                            type="button"
                            onClick={() => onEditBooking(item.booking)}
                            className="
                                w-full rounded-xl border border-[#D25A5A]/40 bg-[#D25A5A]/20
                                p-4 text-left transition hover:bg-[#D25A5A]/30
                            "
                        >
                            <div className="font-semibold">
                                {item.startTime}–{item.endTime}
                            </div>
                            <p className="mt-2">{item.booking.guest.name || <span className="text-white/40">Без контактов</span>}</p>
                            <p className="text-sm text-white/60">{item.booking.guests} гостя</p>
                            {item.booking.comment && (
                                <p className="mt-1 text-sm text-white/50 italic">"{item.booking.comment}"</p>
                            )}
                            <p className="mt-2 text-xs uppercase tracking-wide text-white/50">
                                {getStatusLabel(item.booking.status)}
                            </p>
                        </button>
                    )
                )}
            </div>
            </div>{/* /p-6 wrapper */}

            {/* Кнопка «Новая бронь» — фиксированная снизу на мобиле */}
            {table.status !== "blocked" && (
                <div className="sticky bottom-0 px-4 pb-6 pt-3 md:hidden bg-gradient-to-t from-[#10211D] via-[#10211D]/95 to-transparent">
                    <button
                        type="button"
                        onClick={onBook}
                        className="w-full rounded-2xl bg-[#D7A441] py-4 text-base font-semibold text-black shadow-xl transition hover:bg-[#e0b45d] active:scale-[.98]"
                    >
                        Новая бронь
                    </button>
                </div>
            )}
        </aside>
    );
}
