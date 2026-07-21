import { useState } from "react";

import FloorPlan from "../components/FloorPlan.tsx";
import TablePanel from "../components/TablePanel.tsx";


export default function HomePage() {


    const [selectedTable, setSelectedTable] = useState<Table | null>(null);

    type Table = {
        id:number;
        seats:number;
        status:"free" | "soon" | "reserved";
    };


    return (

        <div className="
        h-screen
        bg-[#10211D]
        text-white
        overflow-hidden
        ">


            <header
                className="
                h-20
                border-b
                border-white/10
                px-8
                flex
                items-center
                justify-between
                "
            >


                <div className="
                flex
                items-center
                gap-4
                ">


                    <div className="
                    w-12
                    h-12
                    rounded-2xl
                    bg-[#D7A441]
                    flex
                    items-center
                    justify-center
                    text-black
                    font-bold
                    text-xl
                    ">
                        G
                    </div>


                    <div>

                        <h1 className="
                        text-xl
                        font-semibold
                        ">
                            Гусь и Огурчик
                        </h1>


                        <p className="
                        text-sm
                        text-white/50
                        ">
                            Система бронирования
                        </p>


                    </div>


                </div>



                <div className="
                flex
                items-center
                gap-6
                ">


                    <div className="text-right">

                        <div className="
                        text-lg
                        font-medium
                        ">
                            21 июля
                        </div>


                        <div className="
                        text-sm
                        text-white/50
                        ">
                            Вторник
                        </div>


                    </div>



                    <div className="
                    text-3xl
                    font-semibold
                    tracking-wider
                    ">
                        19:42
                    </div>


                </div>


            </header>





            <main
                className="
                h-[calc(100vh-80px)]
                grid
                grid-cols-[1fr_360px]
                "
            >



                <section
                    className="
                    relative
                    overflow-hidden
                    "
                >

                    <FloorPlan
                        onSelectTable={setSelectedTable}
                        selectedTableId={selectedTable?.id}
                    />


                </section>





                <aside
                    className="
                    border-l
                    border-white/10
                    bg-black/10
                    "
                >


                    {
                        selectedTable && (

                            <TablePanel

                                table={selectedTable}

                                onClose={() => setSelectedTable(null)}

                            />

                        )
                    }


                </aside>



            </main>


        </div>

    )

}