import type {
    Dispatch,
    SetStateAction
} from "react";


import type {
    Booking,
    Table
} from "../pages/HomePage";



type TablePanelProps = {


    table:Table | null;


    bookings:Booking[];


    setBookings:
        Dispatch<SetStateAction<Booking[]>>;


    selectedDate:string;


    onClose:()=>void;


};





type ScheduleItem = {


    startTime:string;


    endTime:string;


    status:
        | "free"
        | "booking";


    booking?:Booking;


};






function timeToMinutes(time:string){


    const [
        hours,
        minutes
    ] = time.split(":").map(Number);


    return hours * 60 + minutes;

}





function minutesToTime(minutes:number){


    const hours =
        Math.floor(minutes / 60);


    const mins =
        minutes % 60;



    return (

        `${hours.toString().padStart(2,"0")}:${
            mins.toString().padStart(2,"0")
        }`

    );

}







function generateSchedule(

    tableId:number,

    bookings:Booking[],

    date:string


):ScheduleItem[]{



    const dayStart =
        timeToMinutes("10:30");


    const dayEnd =
        timeToMinutes("23:00");



    const tableBookings =

        bookings

            .filter(

                booking =>

                    booking.tableId === tableId &&

                    booking.date === date

            )

            .sort(

                (a,b)=>

                    timeToMinutes(a.startTime)

                    -

                    timeToMinutes(b.startTime)

            );





    const result:ScheduleItem[] = [];



    let current = dayStart;





    tableBookings.forEach(booking=>{


        const bookingStart =
            timeToMinutes(
                booking.startTime
            );


        const bookingEnd =
            timeToMinutes(
                booking.endTime
            );




        if(current < bookingStart){


            result.push({

                startTime:
                    minutesToTime(current),


                endTime:
                    minutesToTime(bookingStart),


                status:"free"


            });


        }





        result.push({


            startTime:
            booking.startTime,


            endTime:
            booking.endTime,


            status:"booking",


            booking


        });



        current = bookingEnd;


    });





    if(current < dayEnd){


        result.push({

            startTime:
                minutesToTime(current),


            endTime:
                minutesToTime(dayEnd),


            status:"free"


        });


    }




    return result;


}







export default function TablePanel({


                                       table,

                                       bookings,

                                       selectedDate,

                                       onClose


                                   }:TablePanelProps){





    if(!table){

        return null;

    }





    const schedule =

        generateSchedule(

            table.id,

            bookings,

            selectedDate

        );





    return (


        <aside

            className="
            h-full
            bg-[#10211D]
            border-l
            border-white/10
            p-6
            text-white
            "

        >



            <div

                className="
                flex
                justify-between
                "

            >



                <div>


                    <h2

                        className="
                        text-2xl
                        font-bold
                        "

                    >

                        Стол №{table.id}


                    </h2>



                    <p className="mt-2 text-white/50">

                        👥 {table.seats} мест

                    </p>


                </div>




                <button

                    onClick={onClose}

                    className="
                    bg-white/10
                    rounded-xl
                    px-3
                    "

                >

                    ×


                </button>


            </div>





            <div

                className="
                mt-4
                text-white/50
                "

            >

                {selectedDate}


            </div>







            <div className="mt-6 space-y-3">



                {
                    schedule.map(

                        (item,index)=>(


                            <div

                                key={index}

                                className={`
                                
                                rounded-xl
                                p-4

                                ${
                                    item.status === "booking"

                                        ?

                                        "bg-[#D25A5A]/20 border border-[#D25A5A]/40"

                                        :

                                        "bg-white/5"

                                }

                                `}

                            >



                                <div

                                    className="
                                    font-semibold
                                    "

                                >

                                    {item.startTime}

                                    {" - "}

                                    {item.endTime}


                                </div>




                                {
                                    item.status === "free"

                                        ?

                                        <p className="mt-2 text-[#4DB980]">

                                            Свободен


                                        </p>


                                        :

                                        <div className="mt-2">


                                            <p>

                                                👤 {item.booking?.guest.name}

                                            </p>



                                            <p>

                                                👥 {item.booking?.guests} гостей

                                            </p>



                                        </div>


                                }


                            </div>


                        )


                    )

                }



            </div>





            <button

                className="
                mt-6
                w-full
                bg-[#D7A441]
                text-black
                py-3
                rounded-xl
                font-semibold
                "

            >

                Создать бронь


            </button>





        </aside>


    );

}