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

const durationOptions = Array.from({ length: 12 }, (_, i) => (i + 1) * 30);
const quickTimes = [
    "13:00", "14:00", "15:00", "16:00",
    "17:00", "18:00", "19:00", "19:30",
    "20:00", "20:30", "21:00", "22:00",
];

function timeToMinutes(time: string) {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}

function minutesToTime(minutes: number) {
    const n = minutes % 1440;
    const h = Math.floor(n / 60);
    const m = n % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function changeTime(value: string, diff: number) {
    const next = Math.min(23 * 60 + 45, Math.max(10 * 60, timeToMinutes(value) + diff));
    return minutesToTime(next);
}

function formatDuration(minutes: number) {
    if (minutes < 60) return `${minutes} мин`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h} ч ${m} мин` : `${h} ч`;
}

function guestWord(n: number) {
    if (n === 1) return "гость";
    if (n >= 2 && n <= 4) return "гостя";
    return "гостей";
}

/** Форматирует строку как +7 (XXX) XXX-XX-XX */
function formatPhone(raw: string): string {
    const digits = raw.replace(/\D/g, "");
    // Нормализация: убираем ведущую 7 или 8
    const local = digits.startsWith("7")
        ? digits.slice(1)
        : digits.startsWith("8")
          ? digits.slice(1)
          : digits;
    const d = local.slice(0, 10);

    if (d.length === 0) return "+7";
    let result = "+7 (" + d.slice(0, 3);
    if (d.length < 3) return result;
    result += ") " + d.slice(3, 6);
    if (d.length < 6) return result;
    result += "-" + d.slice(6, 8);
    if (d.length < 8) return result;
    result += "-" + d.slice(8, 10);
    return result;
}

function phoneDigits(value: string) {
    return value.replace(/\D/g, "");
}

function hasConflict(
    bookings: Booking[],
    tableId: number,
    date: string,
    start: string,
    end: string,
    ignoredBookingId?: number
) {
    const s = timeToMinutes(start);
    const e = timeToMinutes(end);
    return bookings.find((b) => {
        if (b.id === ignoredBookingId) return false;
        if (b.tableId !== tableId || b.date !== date) return false;
        return s < timeToMinutes(b.endTime) && e > timeToMinutes(b.startTime);
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
    const [phone, setPhone] = useState("+7");
    const [name, setName] = useState("");
    const [comment, setComment] = useState("");
    const [confirmDelete, setConfirmDelete] = useState(false);

    const initialDateRef = useRef(selectedDate);
    const initialTimeRef = useRef(selectedTime);

    // Ищем гостя по цифрам номера, а не по точному совпадению строки
    const foundGuest = useMemo(() => {
        const digits = phoneDigits(phone);
        if (digits.length < 11) return undefined;
        return guestsDirectory.find((g) => phoneDigits(g.phone) === digits);
    }, [guestsDirectory, phone]);

    const endTime = useMemo(
        () => minutesToTime(timeToMinutes(time) + durationMinutes),
        [durationMinutes, time]
    );

    const conflict = useMemo(() => {
        if (!table) return undefined;
        return hasConflict(bookings, table.id, date, time, endTime, booking?.id);
    }, [booking?.id, bookings, date, endTime, table, time]);

    const phoneComplete = phoneDigits(phone).length === 11;

    const validationMessage = useMemo(() => {
        if (!date) return "Выберите дату.";
        if (!time) return "Выберите время.";
        if (!durationMinutes) return "Выберите продолжительность.";
        if (!guestCount || guestCount < 1) return "Укажите количество гостей.";
        if (!phoneComplete) return "Введите номер телефона полностью.";
        if (!foundGuest && !name.trim()) return "Укажите имя нового гостя.";
        if (!table) return "Выберите стол на плане.";
        if (table.status === "blocked")
            return table.blockReason
                ? `Стол заблокирован: ${table.blockReason}.`
                : "Стол заблокирован.";
        if (guestCount > table.seats) return "Количество гостей превышает вместимость стола.";
        if (conflict) return `Стол занят с ${conflict.startTime} до ${conflict.endTime}.`;
        return "";
    }, [conflict, date, durationMinutes, foundGuest, guestCount, name, phoneComplete, table, time]);

    // Инициализация формы при открытии
    useEffect(() => {
        if (!open) return;
        setDate(booking?.date ?? initialDateRef.current);
        setTime(booking?.startTime ?? initialTimeRef.current);
        setDurationMinutes(
            booking ? timeToMinutes(booking.endTime) - timeToMinutes(booking.startTime) : 120
        );
        setGuestCount(booking?.guests ?? 2);
        setPhone(booking?.guest.phone ?? "+7");
        setName(booking?.guest.name ?? "");
        setComment(booking?.guest.comment ?? "");
        setConfirmDelete(false);
    }, [booking, open]);

    // Обновляем draft для плана зала
    useEffect(() => {
        if (!open) { onDraftChange(null); return; }
        onDraftChange({ date, time, durationMinutes, guests: guestCount });
    }, [date, durationMinutes, guestCount, onDraftChange, open, time]);

    // Автозаполнение из справочника гостей
    useEffect(() => {
        if (foundGuest) {
            setName(foundGuest.name);
            setComment(foundGuest.comment);
        } else {
            setName("");
            setComment("");
        }
    }, [foundGuest]);

    if (!open) return null;

    return (
        <aside className="
            fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto
            rounded-t-3xl border-t border-white/10 bg-[#10211D] text-white
            md:static md:inset-auto md:z-auto md:h-full md:max-h-none
            md:rounded-none md:border-t-0 md:border-l
        ">
            {/* Drag handle (mobile only) */}
            <div className="flex justify-center pt-3 pb-1 md:hidden">
                <div className="h-1 w-10 rounded-full bg-white/20" />
            </div>
            <div className="p-4 pb-safe-4 md:p-4 md:pb-4">
            <div className="rounded-3xl border border-white/10 bg-[#18322C] p-5 shadow-2xl">

                {/* Заголовок */}
                <div className="mb-5 flex items-start justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-bold leading-tight">
                            {booking ? "Редактирование брони" : "Новая бронь"}
                        </h2>
                        <p className="mt-1 text-sm text-white/55">
                            {table
                                ? `Стол №${table.id} · ${table.seats} места`
                                : "Выберите стол на плане"}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl text-white transition hover:bg-white/20"
                        aria-label="Закрыть"
                    >
                        ×
                    </button>
                </div>

                <div className="space-y-4">

                    {/* Дата и окончание */}
                    <div className="grid grid-cols-[1fr_auto] gap-3">
                        <label className="text-sm font-medium text-white/60">
                            Дата
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="mt-2 h-14 w-full rounded-2xl border border-white/10 bg-white/10 px-4 text-base text-white"
                            />
                        </label>
                        <div className="text-sm font-medium text-white/60">
                            Конец
                            <div className="mt-2 flex h-14 min-w-[76px] items-center justify-center rounded-2xl bg-white/5 px-3 text-lg font-bold text-white">
                                {endTime}
                            </div>
                        </div>
                    </div>

                    {/* Время */}
                    <div className="text-sm font-medium text-white/60">
                        Время начала
                        <div className="mt-2 grid grid-cols-[48px_1fr_48px] items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setTime((t) => changeTime(t, -15))}
                                className="h-12 rounded-xl bg-white/10 text-2xl font-semibold transition active:scale-95 hover:bg-white/15"
                                aria-label="−15 мин"
                            >
                                −
                            </button>
                            <div className="flex h-12 items-center justify-center rounded-xl bg-[#D7A441] text-2xl font-bold text-black tracking-wide">
                                {time}
                            </div>
                            <button
                                type="button"
                                onClick={() => setTime((t) => changeTime(t, 15))}
                                className="h-12 rounded-xl bg-white/10 text-2xl font-semibold transition active:scale-95 hover:bg-white/15"
                                aria-label="+15 мин"
                            >
                                +
                            </button>
                        </div>
                        <div className="mt-2 grid grid-cols-6 gap-1.5">
                            {quickTimes.map((qt) => (
                                <button
                                    key={qt}
                                    type="button"
                                    onClick={() => setTime(qt)}
                                    className={`h-10 rounded-xl text-xs font-semibold transition active:scale-95
                                        ${time === qt
                                            ? "bg-[#D7A441] text-black"
                                            : "bg-white/10 text-white hover:bg-white/15"}`}
                                >
                                    {qt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Длительность */}
                    <div className="text-sm font-medium text-white/60">
                        Длительность
                        <div className="mt-2 grid grid-cols-[48px_1fr_48px] items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setDurationMinutes((d) => Math.max(30, d - 30))}
                                className="h-12 rounded-xl bg-white/10 text-2xl font-semibold transition active:scale-95 hover:bg-white/15"
                                aria-label="−30 мин"
                            >
                                −
                            </button>
                            <div className="flex h-12 items-center justify-center rounded-xl bg-white/10 text-base font-semibold text-white">
                                {formatDuration(durationMinutes)}
                            </div>
                            <button
                                type="button"
                                onClick={() => setDurationMinutes((d) => Math.min(360, d + 30))}
                                className="h-12 rounded-xl bg-white/10 text-2xl font-semibold transition active:scale-95 hover:bg-white/15"
                                aria-label="+30 мин"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Количество гостей */}
                    <div className="text-sm font-medium text-white/60">
                        Гостей
                        <div className="mt-2 grid grid-cols-[64px_1fr_64px] items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setGuestCount((n) => Math.max(1, n - 1))}
                                className="h-14 rounded-2xl bg-white/10 text-2xl font-semibold transition active:scale-95 hover:bg-white/15"
                                aria-label="Меньше гостей"
                            >
                                −
                            </button>
                            <div className="flex h-14 flex-col items-center justify-center rounded-2xl bg-white/10">
                                <span className="text-2xl font-bold leading-none">{guestCount}</span>
                                <span className="mt-0.5 text-xs text-white/50">{guestWord(guestCount)}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setGuestCount((n) => Math.min(12, n + 1))}
                                className="h-14 rounded-2xl bg-white/10 text-2xl font-semibold transition active:scale-95 hover:bg-white/15"
                                aria-label="Больше гостей"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Разделитель */}
                    <div className="h-px bg-white/10" />

                    {/* Телефон */}
                    <label className="block text-sm font-medium text-white/60">
                        Телефон гостя
                        <div className="relative mt-2">
                            <input
                                type="tel"
                                inputMode="numeric"
                                value={phone}
                                onChange={(e) => setPhone(formatPhone(e.target.value))}
                                placeholder="+7 (___) ___-__-__"
                                className="h-14 w-full rounded-2xl border border-white/10 bg-white/10 px-4 text-base text-white placeholder:text-white/25"
                            />
                            {foundGuest && (
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg bg-[#4DB980]/20 px-2 py-1 text-xs font-semibold text-[#4DB980]">
                                    известен
                                </span>
                            )}
                        </div>
                    </label>

                    {/* Имя */}
                    <label className="block text-sm font-medium text-white/60">
                        Имя
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={Boolean(foundGuest)}
                            placeholder={foundGuest ? "" : "Введите имя"}
                            className="mt-2 h-14 w-full rounded-2xl border border-white/10 bg-white/10 px-4 text-base text-white placeholder:text-white/25 disabled:opacity-60"
                        />
                    </label>

                    {/* Комментарий */}
                    <label className="block text-sm font-medium text-white/60">
                        Комментарий
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={3}
                            placeholder="Пожелания, особенности..."
                            className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-base text-white placeholder:text-white/25"
                        />
                    </label>
                </div>

                {/* Ошибка валидации */}
                {validationMessage && (
                    <div className="mt-4 rounded-2xl border border-[#D25A5A]/40 bg-[#D25A5A]/15 px-4 py-3 text-sm text-white">
                        {validationMessage}
                    </div>
                )}

                {/* Кнопка сохранения */}
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

                        if (booking) {
                            onUpdate({ ...nextBooking, id: booking.id }, { ...guest, comment });
                        } else {
                            onCreate(nextBooking, { ...guest, comment });
                        }
                    }}
                    className="
                        mt-5 w-full rounded-2xl bg-[#D7A441] px-4 py-4
                        text-base font-bold text-black transition active:scale-[.98]
                        hover:bg-[#e0b45d] disabled:cursor-not-allowed disabled:opacity-40
                    "
                >
                    {booking ? "Сохранить изменения" : "Создать бронирование"}
                </button>

                {/* Удаление брони */}
                {booking && !confirmDelete && (
                    <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        className="
                            mt-3 w-full rounded-2xl border border-white/10
                            bg-transparent px-4 py-3 text-sm font-semibold text-white/40
                            transition hover:border-[#D25A5A]/40 hover:text-[#D25A5A]
                        "
                    >
                        Удалить бронирование
                    </button>
                )}

                {booking && confirmDelete && (
                    <div className="mt-3 rounded-2xl border border-[#D25A5A]/40 bg-[#D25A5A]/10 p-4">
                        <p className="mb-3 text-center text-sm text-white/80">
                            Удалить бронь? Это действие нельзя отменить.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setConfirmDelete(false)}
                                className="h-12 rounded-xl bg-white/10 text-sm font-semibold transition hover:bg-white/15"
                            >
                                Отмена
                            </button>
                            <button
                                type="button"
                                onClick={() => { onDelete(booking.id); onClose(); }}
                                className="h-12 rounded-xl bg-[#D25A5A] text-sm font-bold text-white transition hover:bg-[#df6b6b]"
                            >
                                Удалить
                            </button>
                        </div>
                    </div>
                )}
            </div>
            </div>{/* /p-4 wrapper */}
        </aside>
    );
}
