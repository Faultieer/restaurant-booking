import { useState } from "react";

import FloorPlan from "../components/FloorPlan";
import TablePanel from "../components/TablePanel";


export type TableStatus =
    | "free"
    | "soon"
    | "reserved";


export type Table = {

    id:number;

    seats:number;

    status:TableStatus;

};



export type BookingStatus =
    | "reserved"
    | "seated"
    | "completed"
    | "cancelled";



export type Booking = {

    id:number;

    tableId:number;

    date:string;

    startTime:string;

    endTime:string;

    guests:number;

    status:BookingStatus;


    guest:{

        name:string;

        phone:string;

        tags:string[];

        comment:string;

    };

};





export default function HomePage(){


    const [selectedDate,setSelectedDate] =
        useState(
            "2026-07-21"
        );


    const [selectedTime,setSelectedTime] =
        useState(
            "19:30"
        );



    const [selectedTable,setSelectedTable] =
        useState<Table | null>(null);



    const [isBookingOpen,setIsBookingOpen] =
        useState(false);



    const [bookingTable,setBookingTable] =
        useState<Table | null>(null);




    const [bookings,setBookings] =
        useState<Booking[]>([


            {

                id:1,

                tableId:13,

                date:"2026-07-21",

                startTime:"14:30",

                endTime:"17:15",

                guests:4,

                status:"reserved",


                guest:{

                    name:"Виталя",

                    phone:"+79999999999",

                    tags:[
                        "Постоянный"
                    ],

                    comment:
                        "Любит блек шип"

                }

            }



        ]);





    function openBooking(){


        setBookingTable(
            selectedTable
        );


        setIsBookingOpen(true);


    }






    function selectTable(table:Table){


        setSelectedTable(table);


    }







    return (


        <div

            className="
            h-screen
            bg-[#10211D]
            text-white
            overflow-hidden
            "

        >



            <header

                className="
                h-20
                border-b
                border-white/10
                px-8
                flex
                items-center
                justify-between
                relative
                "

            >



                <div

                    className="
                    flex
                    items-center
                    gap-4
                    "

                >


                    <div

                        className="
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
                        "

                    >

                        G

                    </div>



                    <div>


                        <h1 className="text-xl font-semibold">

                            Гусь и Огурчик

                        </h1>


                        <p className="text-sm text-white/50">

                            Система бронирования

                        </p>


                    </div>


                </div>





                <div

                    className="
                    absolute
                    left-1/2
                    -translate-x-1/2
                    "

                >

                    <button

                        className="
                        bg-white/10
                        px-6
                        py-3
                        rounded-xl
                        "

                    >

                        Сегодня

                        <span className="ml-3 text-white/50">

                            {selectedTime}

                        </span>


                    </button>


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


                        bookings={bookings}


                        selectedDate={selectedDate}


                        selectedTime={selectedTime}


                        onSelectTable={selectTable}


                        selectedTableId={
                            selectedTable?.id
                        }


                    />



                    <button

                        onClick={openBooking}


                        className="
                        absolute
                        right-8
                        bottom-8

                        bg-[#D7A441]

                        text-black

                        px-8
                        py-4

                        rounded-2xl

                        font-semibold

                        text-lg

                        shadow-xl

                        "

                    >

                        Создать бронь


                    </button>



                </section>






                <aside

                    className="
                    border-l
                    border-white/10
                    "

                >



                    <TablePanel


                        table={selectedTable}


                        bookings={bookings}


                        setBookings={setBookings}


                        selectedDate={selectedDate}


                        onClose={()=>

                            setSelectedTable(null)

                        }


                    />



                </aside>



            </main>




        </div>


    );

}