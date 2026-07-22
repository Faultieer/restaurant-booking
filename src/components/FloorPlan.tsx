import Table from "./Table";

import type {
    Booking,
    Table as TableType
} from "../pages/HomePage";



type FloorPlanProps = {


    bookings:Booking[];


    selectedDate:string;


    selectedTime:string;


    onSelectTable:(table:TableType)=>void;


    selectedTableId?:number;

};





const tables = [


    { id:11, seats:4, x:150, y:100 },

    { id:12, seats:4, x:500, y:100 },


    { id:10, seats:4, x:150, y:250 },

    { id:13, seats:4, x:500, y:250 },


    { id:9, seats:4, x:150, y:500 },

    { id:6, seats:4, x:500, y:500 },


    { id:8, seats:4, x:150, y:650 },

    { id:7, seats:4, x:500, y:650 },


    { id:5, seats:6, x:850, y:500 },

    { id:4, seats:6, x:850, y:650 },


    { id:1, seats:4, x:1080, y:450 },

    { id:2, seats:2, x:1080, y:580 },

    { id:3, seats:4, x:1080, y:710 }


];





function timeToMinutes(time:string){


    const [
        hours,
        minutes
    ] = time.split(":").map(Number);


    return hours * 60 + minutes;

}






function getTableStatus(

    tableId:number,

    bookings:Booking[],

    selectedDate:string,

    selectedTime:string

):

    "free" | "soon" | "reserved"{



    const currentTime =
        timeToMinutes(
            selectedTime
        );



    const tableBookings =
        bookings.filter(

            booking =>

                booking.tableId === tableId &&

                booking.date === selectedDate

        );



    for(const booking of tableBookings){


        const start =
            timeToMinutes(
                booking.startTime
            );


        const end =
            timeToMinutes(
                booking.endTime
            );



        if(
            currentTime >= start &&
            currentTime < end
        ){

            return "reserved";

        }



        if(
            currentTime < start &&
            start - currentTime <= 60
        ){

            return "soon";

        }


    }


    return "free";


}







export default function FloorPlan({


                                      bookings,

                                      selectedDate,

                                      selectedTime,

                                      onSelectTable,

                                      selectedTableId


                                  }:FloorPlanProps){



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







            {
                tables.map(table=>{


                    const status =
                        getTableStatus(

                            table.id,

                            bookings,

                            selectedDate,

                            selectedTime

                        );



                    return (


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


                                status={status}



                                selected={
                                    selectedTableId === table.id
                                }



                                onClick={()=>


                                    onSelectTable({

                                        id:table.id,

                                        seats:table.seats,

                                        status

                                    })


                                }


                            />



                        </div>


                    );


                })

            }




        </div>


    );

}