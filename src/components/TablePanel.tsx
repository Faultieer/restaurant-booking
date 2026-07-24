import { useState } from "react";

import type { Booking, Table } from "../pages/HomePage";

type TablePanelProps = {
    table: Table | null;
    bookings: Booking[];
    selectedDate: string;
    onClose: () => void;
    onEditBooking: (booking: Booking) => void;
    onBlockTable: (tableId: number, reason: string) => void;
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
const blockReasons = ["уборка", "ремонт", "резерв администрации", "другая причина"];

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
    onEditBooking,
    onBlockTable,
    onUnblockTable,
}: TablePanelProps) {
    const [blockReason, setBlockReason] = useState(blockReasons[0]);
    const [customReason, setCustomReason] = useState("");
    const [isBlockOpen, setIsBlockOpen] = useState(false);

    if (!table) {
        return (
            <aside className="h-full border-l border-white/10 bg-[#10211D] p-6 text-white">
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
    const reason = blockReason === "другая причина" ? customReason.trim() : blockReason;

    return (
        <aside className="h-full overflow-y-auto border-l border-white/10 bg-[#10211D] p-6 text-white">
            <div className="flex justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Стол №{table.id}</h2>
                    <p className="mt-2 text-white/50">{table.seats} мест</p>
                    {table.status === "blocked" && (
                        <p className="mt-2 rounded-xl bg-white/10 px-3 py-2 text-sm text-white/75">
                            Недоступно: {table.blockReason ?? "без причины"}
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

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-xl transition hover:bg-white/15"
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
                    <h3 className="font-semibold">Блокировка стола</h3>

                    {table.status === "blocked" ? (
                        <button
                            type="button"
                            onClick={() => {
                                onUnblockTable(table.id);
                                setIsBlockOpen(false);
                            }}
                            className="mt-4 h-12 w-full rounded-xl bg-white/10 px-4 font-semibold transition hover:bg-white/15"
                        >
                            Снять блокировку
                        </button>
                    ) : (
                        <>
                            <select
                                value={blockReason}
                                onChange={(event) => setBlockReason(event.target.value)}
                                className="mt-4 h-12 w-full rounded-xl border border-white/10 bg-white/10 px-3 text-white"
                            >
                                {blockReasons.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>

                            {blockReason === "другая причина" && (
                                <input
                                    type="text"
                                    value={customReason}
                                    onChange={(event) => setCustomReason(event.target.value)}
                                    placeholder="Причина"
                                    className="mt-3 h-12 w-full rounded-xl border border-white/10 bg-white/10 px-3 text-white placeholder:text-white/30"
                                />
                            )}

                            <button
                                type="button"
                                disabled={!reason}
                                onClick={() => {
                                    onBlockTable(table.id, reason);
                                    setIsBlockOpen(false);
                                }}
                                className="
                                    mt-4 h-12 w-full rounded-xl bg-[#D25A5A] px-4
                                    font-semibold text-white transition hover:bg-[#df6b6b]
                                    disabled:cursor-not-allowed disabled:opacity-45
                                "
                            >
                                Заблокировать
                            </button>
                        </>
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
                            <p className="mt-2">{item.booking.guest.name}</p>
                            <p className="text-sm text-white/60">{item.booking.guests} гостя</p>
                            <p className="mt-2 text-xs uppercase tracking-wide text-white/50">
                                {getStatusLabel(item.booking.status)}
                            </p>
                        </button>
                    )
                )}
            </div>

        </aside>
    );
}
