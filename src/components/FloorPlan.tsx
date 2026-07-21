import Table from "./Table";


type FloorPlanProps = {
    onSelectTable: (table: {
        id:number;
        seats:number;
        status:"free" | "soon" | "reserved";
    }) => void;

    selectedTableId?: number;
};


const tables: {
    id:number;
    seats:number;
    x:number;
    y:number;
    status:"free" | "soon" | "reserved";
}[] = [

    // верхняя левая зона

    { id:11, seats:4, x:150, y:100, status:"free" },
    { id:12, seats:4, x:500, y:100, status:"free" },

    { id:10, seats:4, x:150, y:250, status:"free" },
    { id:13, seats:4, x:500, y:250, status:"soon" },


    // нижняя левая зона

    { id:9, seats:4, x:150, y:500, status:"reserved" },
    { id:6, seats:4, x:500, y:500, status:"free" },

    { id:8, seats:4, x:150, y:650, status:"free" },
    { id:7, seats:4, x:500, y:650, status:"free" },


    // правая зона возле стены

    { id:5, seats:6, x:850, y:500, status:"soon" },
    { id:4, seats:6, x:850, y:650, status:"free" },


    // правая колонна

    { id:1, seats:4, x:1080, y:450, status:"free" },
    { id:2, seats:2, x:1080, y:580, status:"reserved" },
    { id:3, seats:4, x:1080, y:710, status:"free" }

];


export default function FloorPlan({
                                      onSelectTable,
                                      selectedTableId
                                  }: FloorPlanProps) {


    return (

        <div
            className="
            relative
            w-full
            h-full
            min-h-[900px]
            overflow-hidden
            "
        >


            {/* Стена между залом и баром */}

            <div
                className="
                absolute
                bg-white/20
                rounded-full
                "
                style={{
                    left:760,
                    top:40,
                    width:12,
                    height:820
                }}
            />



            {/* Бар */}

            <div
                className="
                absolute
                w-72
                h-36
                rounded-3xl

                bg-white/5
                border
                border-white/10

                flex
                items-center
                justify-center

                text-white/40
                text-xl
                "
                style={{
                    left:850,
                    top:100
                }}
            >

                Бар

            </div>




            {/* Столы */}

            {
                tables.map(table => (

                    <div
                        key={table.id}

                        className="
                        absolute
                        "

                        style={{
                            left:table.x,
                            top:table.y
                        }}

                    >

                        <Table

                            number={table.id}

                            seats={table.seats}

                            status={table.status}

                            selected={selectedTableId === table.id}

                            onClick={() => onSelectTable(table)}

                        />


                    </div>

                ))
            }


        </div>

    )

}