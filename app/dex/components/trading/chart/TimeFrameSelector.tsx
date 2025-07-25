// components/trading/chart/TimeFrameSelector.tsx - Time frame switching
import { TimeFrame } from "./types";

interface TimeFrameSelectorProps {
  currentTimeFrame: TimeFrame;
  onTimeFrameChange: (timeFrame: TimeFrame) => void;
  className?: string;
}

export const TimeFrameSelector = ({
  currentTimeFrame,
  onTimeFrameChange,
  className = "",
}: TimeFrameSelectorProps) => {
  const timeFrames: { value: TimeFrame; label: string }[] = [
    { value: "1h", label: "1H" },
    { value: "4h", label: "4H" },
    { value: "1d", label: "1D" },
    { value: "7d", label: "7D" },
    { value: "30d", label: "30D" },
    { value: "all", label: "ALL" },
  ];

  return (
    <div className={`flex bg-muted/20 rounded-lg p-1 ${className}`}>
      {timeFrames.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onTimeFrameChange(value)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            currentTimeFrame === value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};
