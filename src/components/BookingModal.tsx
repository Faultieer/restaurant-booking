import { useEffect, useMemo, useRef, useState } from "react";

import type { Booking, Guest, Table } from "../pages/HomePage";

type BookingDraft = {
    date: string;
    time: string;
    durationMinutes: number;
    guests: number;
};

type BookingModalProps = {
    open: boolean;
    table: Table | null;
    booking: Booking | null;
    bookings: Booking[];
    selectedDate: string;
    selectedTime: string;
    guestsDirectory: Guest[];
    onClose: () => void;
    onDraftChange: (draft: BookingDraft | null) => void;
    onCreate: (booking: Omit<Booking, "id">, guest: Guest) => void;
    onUpdate: (booking: Booking, guest: Guest) => void;
    onDelete: (bookingId: number) => void;
};

const durationOptions = Array.from({ length: 12 }, (_, index) => (index + 1) * 30);
const quickTimes = ["13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "19:30", "20:00", "20:30", "21:00", "22:00"];

function timeToMinutes(time: string) {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
}

function minutesToTime(minutes: number) {
    const normalized = minutes % 1440;
    const hours = Math.floor(normalized / 60);
    const mins = normalized % 60;
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function changeTime(value: string, diff: number) {
    const next = Math.min(23 * 60 + 45, Math.max(10 * 60, timeToMinutes(value) + diff));
    return minutesToTime(next);
}

function formatDuration(minutes: number) {
    if (minutes < 60) {
        return `${minutes} минут`;
    }

    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;

    return rest ? `${hours} ч ${rest} мин` : `${hours} ч`;
}

function hasConflict(
    bookings: Booking[],
    tableId: number,
    date: string,
    start: string,
    end: string,
    ignoredBookingId?: number
) {
    const startMinutes = timeToMinutes(start);
    const endMinutes = timeToMinutes(end);

    return bookings.find((booking) => {
        if (booking.id === ignoredBookingId) return false;
        if (booking.tableId !== tableId || booking.date !== date) return false;

        const bookingStart = timeToMinutes(booking.startTime);
        const bookingEnd = timeToMinutes(booking.endTime);

        return startMinutes < bookingEnd && endMinutes > bookingStart;
    });
}

export default function BookingModal({
    open,
    table,
    booking,
    bookings,
    selectedDate,
    selectedTime,
    guestsDirectory,
    onClose,
    onDraftChange,
    onCreate,
    onUpdate,
    onDelete,
}: BookingModalProps) {
    const [date, setDate] = useState(selectedDate);
    const [time, setTime] = useState(selectedTime);
    const [durationMinutes, setDurationMinutes] = useState(120);
    const [guestCount, setGuestCount] = useState(2);

    // Remember initial values so useEffect doesn't re-trigger on header date/time changes
    const initialDateRef = useRef(selectedDate);
    const initialTimeRef = useRef(selectedTime);
    const [phone, setPhone] = useState("");
    const [name, setName] = useState("");
    const [comment, setComment] = useState("");

    const foundGuest = useMemo(
        () => guestsDirectory.find((guest) => guest.phone === phone.trim()),
        [guestsDirectory, phone]
    );

    const endTime = useMemo(
        () => minutesToTime(timeToMinutes(time) + durationMinutes),
        [durationMinutes, time]
    );

    const conflict = useMemo(() => {
        if (!table) return undefined;
        return hasConflict(bookings, table.id, date, time, endTime, booking?.id);
    }, [booking?.id, bookings, date, endTime, table, time]);

    const validationMessage = useMemo(() => {
        if (!date) return "Выберите дату.";
        if (!time) return "Выберите время.";
        if (!durationMinutes) return "Выберите продолжительность.";
        if (!guestCount || guestCount < 1) return "Укажите количество гостей.";
        if (!phone.trim()) return "Укажите телефон гостя.";
        if (!foundGuest && !name.trim()) return "Укажите имя нового гостя.";
        if (!table) return "Выберите подходящий стол на плане.";
        if (table.status === "blocked") {
            return table.blockReason
                ? `Стол заблокирован: ${table.blockReason}.`
                : "Стол заблокирован.";
        }
        if (guestCount > table.seats) return "Количество гостей превышает вместимость стола.";
        if (conflict) return `Стол занят с ${conflict.startTime} до ${conflict.endTime}.`;

        return "";
    }, [conflict, date, durationMinutes, foundGuest, guestCount, name, phone, table, time]);

    useEffect(() => {
        if (!open) return;

        // Use refs to capture the initial date/time when modal opens,
        // so the form doesn't reset if the user changes header date while modal is open.
        setDate(booking?.date ?? initialDateRef.current);
        setTime(booking?.startTime ?? initialTimeRef.current);
        setDurationMinutes(
            booking
                ? timeToMinutes(booking.endTime) - timeToMinutes(booking.startTime)
                : 120
        );
        setGuestCount(booking?.guests ?? 2);
        setPhone(booking?.guest.phone ?? "");
        setName(booking?.guest.name ?? "");
        setComment(booking?.guest.comment ?? "");
    }, [booking, open]);

    useEffect(() => {
        if (!open) {
            onDraftChange(null);
            return;
        }

        onDraftChange({
            date,
            time,
            durationMinutes,
            guests: guestCount,
        });
    }, [date, durationMinutes, guestCount, onDraftChange, open, time]);

    useEffect(() => {
        if (foundGuest) {
            setName(foundGuest.name);
            setComment(foundGuest.comment);
        } else {
            // Clear auto-filled fields when phone no longer matches a known guest
            setName("");
            setComment("");
        }
    }, [foundGuest]);

    if (!open) return null;

    return (
        <aside className="h-full overflow-y-auto border-l border-white/10 bg-[#10211D] p-5 text-white">
            <div className="rounded-3xl border border-white/10 bg-[#18322C] p-5 shadow-2xl">
                <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold">
                            {booking ? "Редактирование брони" : "Новая бронь"}
                        </h2>
                        <p className="mt-1 text-sm text-white/55">
                            {table ? `Стол №${table.id}, ${table.seats} мест` : "Выберите стол на плане"}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl bg-white/10 px-3 py-2 text-white transition hover:bg-white/15"
                    >
                        ×
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-[1fr_180px] gap-3">
                        <label className="text-sm text-white/60">
                            Дата
                            <input
                                type="date"
                                value={date}
                                onChange={(event) => setDate(event.target.value)}
                                className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/10 px-3 text-base text-white"
                            />
                        </label>

                        <div className="text-sm text-white/60">
                            Окончание
                            <div className="mt-2 flex h-12 items-center rounded-xl bg-white/5 px-3 text-base font-semibold text-white">
                                {endTime}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-white/5 p-3">
                        <div className="mb-3 text-sm text-white/60">Время</div>

                        <div className="grid grid-cols-[56px_1fr_56px] items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setTime((current) => changeTime(current, -15))}
                                className="h-14 rounded-2xl bg-white/10 text-2xl font-semibold transition hover:bg-white/15"
                                aria-label="Уменьшить время на 15 минут"
                            >
                                −
                            </button>

                            <div className="flex h-16 items-center justify-center rounded-2xl bg-[#D7A441] text-3xl font-bold text-black">
                                {time}
                            </div>

                            <button
                                type="button"
                                onClick={() => setTime((current) => changeTime(current, 15))}
                                className="h-14 rounded-2xl bg-white/10 text-2xl font-semibold transition hover:bg-white/15"
                                aria-label="Увеличить время на 15 минут"
                            >
                                +
                            </button>
                        </div>

                        <div className="mt-3 grid grid-cols-4 gap-2">
                            {quickTimes.map((quickTime) => (
                                <button
                                    key={quickTime}
                                    type="button"
                                    onClick={() => setTime(quickTime)}
                                    className={`
                                        h-11 rounded-xl text-sm font-semibold transition
                                        ${time === quickTime
                                            ? "bg-[#D7A441] text-black"
                                            : "bg-white/10 text-white hover:bg-white/15"}
                                    `}
                                >
                                    {quickTime}
                                </button>
                            ))}
                        </div>
                    </div>

                    <label className="text-sm text-white/60">
                        Длительность
                        <select
                            value={durationMinutes}
                            onChange={(event) => setDurationMinutes(Number(event.target.value))}
                            className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/10 px-3 text-base text-white"
                        >
                            {durationOptions.map((duration) => (
                                <option key={duration} value={duration}>
                                    {formatDuration(duration)}
                                </option>
                            ))}
                        </select>
                    </label>

                    <div className="text-sm text-white/60">
                        Гостей
                        <div className="mt-2 grid grid-cols-[44px_1fr_44px] items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setGuestCount((n) => Math.max(1, n - 1))}
                                className="h-11 rounded-xl bg-white/10 text-xl font-semibold transition hover:bg-white/15"
                                aria-label="Уменьшить"
                            >
                                −
                            </button>
                            <div className="flex h-11 items-center justify-center rounded-xl bg-white/10 text-base font-semibold text-white">
                                {guestCount} {guestCount === 1 ? "гость" : guestCount < 5 ? "гостя" : "гостей"}
                            </div>
                            <button
                                type="button"
                                onClick={() => setGuestCount((n) => Math.min(12, n + 1))}
                                className="h-11 rounded-xl bg-white/10 text-xl font-semibold transition hover:bg-white/15"
                                aria-label="Увеличить"
                            >
                                +
                            </button>
                        </div>
                    </div>
                    <label className="block text-sm text-white/60">
                        Телефон
                        <input
                            type="tel"
                            value={phone}
                            onChange={(event) => setPhone(event.target.value)}
                            placeholder="+7..."
                            className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/10 px-3 text-base text-white placeholder:text-white/30"
                        />
                    </label>

                    <label className="block text-sm text-white/60">
                        Имя
                        <input
                            type="text"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            disabled={Boolean(foundGuest)}
                            className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/10 px-3 text-base text-white disabled:opacity-70"
                        />
                    </label>

                    <label className="block text-sm text-white/60">
                        Комментарий
                        <textarea
                            value={comment}
                            onChange={(event) => setComment(event.target.value)}
                            rows={3}
                            className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-white"
                        />
                    </label>
                </div>

                {validationMessage && (
                    <div className="mt-4 rounded-2xl border border-[#D25A5A]/40 bg-[#D25A5A]/15 p-3 text-sm text-white">
                        {validationMessage}
                    </div>
                )}

                <button
                    type="button"
                    disabled={Boolean(validationMessage)}
                    onClick={() => {
                        if (!table) return;

                        const guest: Guest = foundGuest ?? {
                            id: Date.now(),
                            name: name.trim(),
                            phone: phone.trim(),
                            tags: [],
                            comment: comment.trim(),
                        };

                        const nextBooking = {
                            tableId: table.id,
                            date,
                            startTime: time,
                            endTime,
                            guests: guestCount,
                            status: booking?.status ?? "reserved",
                            guest: {
                                name: guest.name,
                                phone: guest.phone,
                                tags: guest.tags,
                                comment,
                            },
                        };

                        const nextGuest = {
                            ...guest,
                            comment,
                        };

                        if (booking) {
                            onUpdate({ ...nextBooking, id: booking.id }, nextGuest);
                            return;
                        }

                        onCreate(nextBooking, nextGuest);
                    }}
                    className="
                        mt-5 w-full rounded-2xl bg-[#D7A441] px-4 py-4
                        font-semibold text-black transition hover:bg-[#e0b45d]
                        disabled:cursor-not-allowed disabled:opacity-45
                    "
                >
                    {booking ? "Сохранить изменения" : "Создать бронирование"}
                </button>

                {booking && (
                    <button
                        type="button"
                        onClick={() => {
                            onDelete(booking.id);
                            onClose();
                        }}
                        className="
                            mt-3 w-full rounded-2xl border border-[#D25A5A]/40
                            bg-[#D25A5A]/15 px-4 py-3 font-semibold text-[#D25A5A]
                            transition hover:bg-[#D25A5A]/25
                        "
                    >
                        Удалить бронирование
                    </button>
                )}
            </div>
        </aside>
    );
}
