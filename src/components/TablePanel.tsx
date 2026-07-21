import { useState } from "react";

type TablePanelProps = {
    table: {
        id:number;
        seats:number;
        status:"free" | "soon" | "reserved";
    } | null;

    onClose: () => void;
};


export default function TablePanel({
                                       table,
                                       onClose
                                   }: TablePanelProps) {


    const [guest, setGuest] = useState("");

    if(!table){
        return null;
    }


    return (

        <aside className="
        h-full
        bg-[#143029]
        border-l
        border-white/10
        p-6
        text-white
        ">


            <div className="
            flex
            justify-between
            items-center
            mb-8
            ">

                <h2 className="text-2xl font-bold">
                    Стол №{table.id}
                </h2>


                <button
                    onClick={onClose}
                    className="
                    text-white/50
                    hover:text-white
                    "
                >
                    ✕
                </button>


            </div>



            <div className="space-y-4">


                <div>
                    <p className="text-white/50 text-sm">
                        Вместимость
                    </p>

                    <p className="text-lg">
                        👥 {table.seats} мест
                    </p>
                </div>



                <div>
                    <p className="text-white/50 text-sm">
                        Статус
                    </p>

                    <p className="text-lg">
                        {
                            table.status === "free"
                            &&
                            "Свободен"
                        }

                        {
                            table.status === "soon"
                            &&
                            "Скоро занят"
                        }

                        {
                            table.status === "reserved"
                            &&
                            "Занят"
                        }

                    </p>

                </div>



                <div className="pt-6">

                    <label className="
                    text-sm
                    text-white/50
                    ">
                        Гость
                    </label>


                    <input

                        value={guest}

                        onChange={
                            e=>setGuest(e.target.value)
                        }

                        placeholder="
                        Имя или телефон
                        "

                        className="
                        mt-2
                        w-full
                        bg-black/20
                        border
                        border-white/10
                        rounded-xl
                        p-3
                        outline-none
                        "

                    />

                </div>



                <button

                    className="
                    mt-6
                    w-full
                    bg-[#D7A441]
                    text-black
                    font-bold
                    py-4
                    rounded-xl
                    "

                >

                    Забронировать

                </button>


            </div>


        </aside>

    )
}