import { useEffect, useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import { ru } from "react-day-picker/locale";

import TimeWheel from "./TimeWheel";

type DateTimePopoverProps = {
    open: boolean;
    selectedDate: string;
    selectedTime: string;
    onClose: () => void;
    onApply: (date: string, time: string) => void;
};

function toDate(value: string) {
    const parsed = new Date(`${value}T00:00:00`);

    if (Number.isNaN(parsed.getTime())) {
        return new Date();
    }

    return parsed;
}

function toDateString(value: Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function todayStart() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return now;
}

function toAllowedDate(value: string) {
    const parsed = toDate(value);
    const minDate = todayStart();

    return parsed < minDate ? minDate : parsed;
}

export default function DateTimePopover({
    open,
    selectedDate,
    selectedTime,
    onClose,
    onApply,
}: DateTimePopoverProps) {
    const [date, setDate] = useState<Date>(() => toAllowedDate(selectedDate));
    const [hour, setHour] = useState(() => selectedTime.split(":")[0] ?? "19");
    const [minute, setMinute] = useState(() => selectedTime.split(":")[1] ?? "30");

    useEffect(() => {
        if (!open) return;

        setDate(toAllowedDate(selectedDate));
        setHour(selectedTime.split(":")[0] ?? "19");
        setMinute(selectedTime.split(":")[1] ?? "30");
    }, [open, selectedDate, selectedTime]);

    const hours = useMemo(
        () =>
            Array.from({ length: 14 }, (_, index) =>
                String(index + 10).padStart(2, "0")
            ),
        []
    );

    const minutes = useMemo(() => ["00", "15", "30", "45"], []);
    const minDate = useMemo(() => todayStart(), []);

    if (!open) return null;

    return (
        <>
            <div
                onClick={onClose}
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />

            <div
                role="dialog"
                aria-modal="true"
                onClick={(event) => event.stopPropagation()}
                className="
                    fixed left-1/2 top-1/2 z-50
                    w-[min(440px,calc(100vw-32px))]
                    -translate-x-1/2 -translate-y-1/2
                    rounded-3xl border border-white/10
                    bg-[#18322C] p-6 text-white shadow-2xl
                "
            >
                <section>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white/60">
                        Дата
                    </h2>

                    <DayPicker
                        mode="single"
                        selected={date}
                        onSelect={(nextDate) => {
                            if (nextDate) {
                                setDate(nextDate);
                            }
                        }}
                        disabled={{ before: minDate }}
                        locale={ru}
                        weekStartsOn={1}
                        numberOfMonths={1}
                        showOutsideDays
                        className="date-time-calendar"
                        classNames={{
                            root: "relative w-full",
                            month: "w-full",
                            month_caption: "mb-4 flex items-center justify-center text-base font-semibold text-white",
                            nav: "absolute left-0 right-0 top-0 flex items-center justify-between",
                            button_previous:
                                "flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/15",
                            button_next:
                                "flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/15",
                            chevron: "h-4 w-4 fill-white",
                            weekdays: "grid grid-cols-7 gap-1",
                            weekday:
                                "flex h-8 items-center justify-center text-xs font-medium uppercase text-white/40",
                            week: "grid grid-cols-7 gap-1",
                            day: "h-10 w-10",
                            day_button:
                                "h-10 w-10 rounded-xl text-sm font-medium text-white transition hover:bg-white/10",
                            today: "text-[#D7A441]",
                            selected: "rounded-xl bg-[#D7A441] text-black",
                            disabled: "pointer-events-none opacity-25",
                            outside: "text-white/25",
                        }}
                    />
                </section>

                <div className="my-6 h-px bg-white/10" />

                <section>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white/60">
                        Время
                    </h2>

                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl bg-white/5 px-4 py-2">
                        <TimeWheel
                            values={hours}
                            value={hour}
                            onChange={setHour}
                            height={180}
                            itemHeight={44}
                        />

                        <div className="flex h-full items-center justify-center text-4xl font-bold text-white/70">
                            :
                        </div>

                        <TimeWheel
                            values={minutes}
                            value={minute}
                            onChange={setMinute}
                            height={180}
                            itemHeight={44}
                        />
                    </div>
                </section>

                <div className="my-6 h-px bg-white/10" />

                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="
                            rounded-2xl bg-white/10 px-4 py-3
                            font-semibold text-white transition hover:bg-white/15
                        "
                    >
                        Отмена
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            onApply(toDateString(date), `${hour}:${minute}`);
                            onClose();
                        }}
                        className="
                            rounded-2xl bg-[#D7A441] px-4 py-3
                            font-semibold text-black transition hover:bg-[#e0b45d]
                        "
                    >
                        Применить
                    </button>
                </div>
            </div>
        </>
    );
}
