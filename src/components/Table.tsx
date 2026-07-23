export type TableVisualStatus =
    | "free"
    | "soon"
    | "reserved"
    | "blocked"
    | "available"
    | "unavailable";

type TableProps = {
    number: number;
    seats: number;
    status: TableVisualStatus;
    label: string;
    onClick?: () => void;
    selected?: boolean;
};

export default function Table({
    number,
    seats,
    status,
    label,
    onClick,
    selected,
}: TableProps) {
    const colors = {
        free: {
            border: "border-[#4DB980]",
            dot: "#4DB980",
            bg: "bg-[#17332C]",
        },
        soon: {
            border: "border-[#D7A441]",
            dot: "#D7A441",
            bg: "bg-[#D7A441]/15",
        },
        reserved: {
            border: "border-[#D25A5A]",
            dot: "#D25A5A",
            bg: "bg-[#D25A5A]/20",
        },
        blocked: {
            border: "border-white/35",
            dot: "rgba(255,255,255,.55)",
            bg: "bg-white/10",
        },
        available: {
            border: "border-[#4DB980]",
            dot: "#4DB980",
            bg: "bg-[#4DB980]/20",
        },
        unavailable: {
            border: "border-[#D25A5A]",
            dot: "#D25A5A",
            bg: "bg-[#D25A5A]/25",
        },
    };

    return (
        <button
            type="button"
            onClick={onClick}
            className={`
                relative flex h-24 w-36 flex-col items-center justify-center
                rounded-xl border-2 px-3 text-center transition hover:scale-105
                ${colors[status].bg}
                ${colors[status].border}
                ${selected ? "scale-105 ring-4 ring-[#D7A441]" : ""}
            `}
        >
            <div
                className="absolute right-2 top-2 h-3 w-3 rounded-full"
                style={{ backgroundColor: colors[status].dot }}
            />

            <div className="text-sm font-semibold text-white/70">Стол №{number}</div>
            <div className="text-xs text-white/50">{seats} мест</div>
            <div className="mt-2 min-h-8 text-xs font-medium leading-4 text-white">
                {label}
            </div>
        </button>
    );
}
