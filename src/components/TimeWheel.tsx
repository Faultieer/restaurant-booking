import Picker from "react-mobile-picker";
import type { PickerValue } from "react-mobile-picker";

type TimeWheelProps = {
    values: string[];
    value: string;
    onChange: (value: string) => void;
    height?: number;
    itemHeight?: number;
    disabledValues?: Set<string>;
};

export default function TimeWheel({
    values,
    value,
    onChange,
    height = 220,
    itemHeight = 44,
    disabledValues,
}: TimeWheelProps) {
    const pickerValue: PickerValue = { value };

    return (
        <Picker
            value={pickerValue}
            onChange={(next) => onChange(String(next.value))}
            height={height}
            itemHeight={itemHeight}
            wheelMode="natural"
        >
            <Picker.Column name="value">
                {values.map((item) => (
                    <Picker.Item key={item} value={item}>
                        <div className={`flex h-full items-center justify-center text-xl font-medium transition-colors ${
                            disabledValues?.has(item)
                                ? "text-[#D25A5A]/60"
                                : "text-white"
                        }`}>
                            {item}
                        </div>
                    </Picker.Item>
                ))}
            </Picker.Column>
        </Picker>
    );
}
