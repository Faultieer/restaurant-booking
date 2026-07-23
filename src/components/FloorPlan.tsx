import Table from "./Table";
import type { TableVisualStatus } from "./Table";

import type { Booking, Table as TableType } from "../pages/HomePage";

type BookingDraft = {
    date: string;
    time: string;
    durationMinutes: number;
    guests: number;
};

type FloorPlanProps = {
    tables: TableType[];
    bookings: Booking[];
    selectedDate: string;
    selectedTime: string;
    bookingDraft: BookingDraft | null;
    onSelectTable: (table: TableType) => void;
    selectedTableId?: number;
    bookingTableId?: number;
};

export const initialFloorTables: TableType[] = [
    { id: 11, seats: 4, status: "free" },
    { id: 12, seats: 4, status: "free" },
    { id: 10, seats: 4, status: "free" },
    { id: 13, seats: 4, status: "free" },
    { id: 9, seats: 4, status: "free" },
    { id: 6, seats: 4, status: "free" },
    { id: 8, seats: 4, status: "free" },
    { id: 7, seats: 4, status: "free" },
    { id: 5, seats: 6, status: "free" },
    { id: 4, seats: 6, status: "free" },
    { id: 1, seats: 4, status: "free" },
    { id: 2, seats: 2, status: "blocked", blockReason: "ремонт" },
    { id: 3, seats: 4, status: "free" },
];

const tablePositions = [
    { id: 11, x: 150, y: 100 },
    { id: 12, x: 500, y: 100 },
    { id: 10, x: 150, y: 250 },
    { id: 13, x: 500, y: 250 },
    { id: 9, x: 150, y: 500 },
    { id: 6, x: 500, y: 500 },
    { id: 8, x: 150, y: 650 },
    { id: 7, x: 500, y: 650 },
    { id: 5, x: 850, y: 500 },
    { id: 4, x: 850, y: 650 },
    { id: 1, x: 1080, y: 450 },
    { id: 2, x: 1080, y: 580 },
    { id: 3, x: 1080, y: 710 },
];

function timeToMinutes(time: string) {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
}

function overlaps(start: number, end: number, booking: Booking) {
    const bookingStart = timeToMinutes(booking.startTime);
    const bookingEnd = timeToMinutes(booking.endTime);
    return start < bookingEnd && end > bookingStart;
}

function getTableBookings(tableId: number, bookings: Booking[], date: string) {
    return bookings
        .filter((booking) => booking.tableId === tableId && booking.date === date)
        .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
}

function getBaseState(table: TableType, bookings: Booking[], date: string, time: string) {
    if (table.status === "blocked") {
        return {
            status: "blocked" as TableVisualStatus,
            label: table.blockReason ? `Недоступно: ${table.blockReason}` : "Недоступно",
        };
    }

    const currentTime = timeToMinutes(time);
    const tableBookings = getTableBookings(table.id, bookings, date);
    const activeBooking = tableBookings.find((booking) => {
        const start = timeToMinutes(booking.startTime);
        const end = timeToMinutes(booking.endTime);
        return currentTime >= start && currentTime < end;
    });

    if (activeBooking) {
        return {
            status: "reserved" as TableVisualStatus,
            label: `Занят до ${activeBooking.endTime}`,
        };
    }

    const nextBooking = tableBookings.find(
        (booking) => timeToMinutes(booking.startTime) > currentTime
    );

    if (nextBooking) {
        const startsIn = timeToMinutes(nextBooking.startTime) - currentTime;

        return {
            status: startsIn <= 60 ? "soon" as TableVisualStatus : "free" as TableVisualStatus,
            label: `Бронь с ${nextBooking.startTime}`,
        };
    }

    return {
        status: "free" as TableVisualStatus,
        label: "Свободно",
    };
}

function getDraftState(table: TableType, bookings: Booking[], draft: BookingDraft) {
    if (table.status === "blocked") {
        return {
            status: "blocked" as TableVisualStatus,
            label: table.blockReason ? `Недоступно: ${table.blockReason}` : "Недоступно",
        };
    }

    const start = timeToMinutes(draft.time);
    const end = start + draft.durationMinutes;
    const tableBookings = getTableBookings(table.id, bookings, draft.date);
    const conflictingBooking = tableBookings.find((booking) => overlaps(start, end, booking));

    if (draft.guests > table.seats) {
        const nextBooking = tableBookings.find(
            (booking) => timeToMinutes(booking.endTime) > start
        );

        return {
            status: "unavailable" as TableVisualStatus,
            label: nextBooking ? `Освободится в ${nextBooking.endTime}` : "Недоступно",
        };
    }

    if (conflictingBooking) {
        return {
            status: "unavailable" as TableVisualStatus,
            label: `Занят до ${conflictingBooking.endTime}`,
        };
    }

    return {
        status: "available" as TableVisualStatus,
        label: "Свободно",
    };
}

export default function FloorPlan({
    tables,
    bookings,
    selectedDate,
    selectedTime,
    bookingDraft,
    onSelectTable,
    selectedTableId,
    bookingTableId,
}: FloorPlanProps) {
    return (
        <div className="relative h-full min-h-[900px] w-full overflow-hidden">
            <div
                className="absolute rounded-full bg-white/20"
                style={{ left: 760, top: 40, width: 12, height: 820 }}
            />

            <div
                className="
                    absolute flex h-36 w-72 items-center justify-center
                    rounded-3xl border border-white/10 bg-white/5 text-xl text-white/40
                "
                style={{ left: 850, top: 100 }}
            >
                Бар
            </div>

            {tables.map((table) => {
                const position = tablePositions.find((item) => item.id === table.id);
                const tableState = bookingDraft
                    ? getDraftState(table, bookings, bookingDraft)
                    : getBaseState(table, bookings, selectedDate, selectedTime);

                if (!position) return null;

                return (
                    <div
                        key={table.id}
                        className="absolute"
                        style={{ left: position.x, top: position.y }}
                    >
                        <Table
                            number={table.id}
                            seats={table.seats}
                            status={tableState.status}
                            label={tableState.label}
                            selected={
                                selectedTableId === table.id || bookingTableId === table.id
                            }
                            onClick={() => onSelectTable(table)}
                        />
                    </div>
                );
            })}
        </div>
    );
}
