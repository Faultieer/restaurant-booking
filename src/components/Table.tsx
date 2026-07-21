type TableProps = {
    number: number;
    seats: number;
    status: "free" | "soon" | "reserved";
    onClick?: () => void;
    selected?: boolean;
};

export default function Table({
                                  number,
                                  seats,
                                  status,
                                  onClick,
                                  selected
                              }: TableProps) {


    const colors = {

        free: {
            border: "border-[#4DB980]",
            dot: "#4DB980"
        },

        soon: {
            border: "border-[#D7A441]",
            dot: "#D7A441"
        },

        reserved: {
            border: "border-[#D25A5A]",
            dot: "#D25A5A"
        }

    };


    return (

        <div

            onClick={onClick}

            className={`
            
            relative
            
            flex
            flex-col
            items-center
            justify-center

            w-32
            h-20

            rounded-xl

            bg-[#17332C]

            border-2

            ${colors[status].border}
            ${selected ? "ring-4 ring-[#D7A441] scale-110" : ""}

            cursor-pointer

            transition

            hover:scale-105

            `}

        >


            {/* статус */}

            <div
                className="
                absolute
                top-2
                right-2

                w-3
                h-3

                rounded-full
                "

                style={{
                    backgroundColor: colors[status].dot
                }}

            />



            {/* номер */}

            <div
                className="
                text-xl
                font-bold
                "
            >
                {number}
            </div>



            {/* места */}

            <div
                className="
                text-xs
                text-white/50
                "
            >
                👥 {seats}
            </div>


        </div>

    )

}