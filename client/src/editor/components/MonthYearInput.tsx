import React, { useState, useEffect, useRef, ReactNode } from "react";

const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const currentYear = new Date().getFullYear();
const YEARS: number[] = [];
for (let y = currentYear + 8; y >= 1980; y--) {
  YEARS.push(y);
}

interface MonthYearInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  help?: ReactNode;
  warning?: string;
  id?: string;
}

export const MonthYearInput: React.FC<MonthYearInputProps> = ({
  label,
  value,
  onChange,
  disabled = false,
  help,
  warning,
  id,
}) => {
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const lastEmittedValue = useRef(value);

  useEffect(() => {
    if (disabled) {
      setSelectedMonth("");
      setSelectedYear("");
      lastEmittedValue.current = "";
      return;
    }

    if (value !== lastEmittedValue.current) {
      lastEmittedValue.current = value;
      if (value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
        const [y, m] = value.split("-");
        setSelectedYear(y);
        setSelectedMonth(m);
      } else if (!value) {
        setSelectedMonth("");
        setSelectedYear("");
      }
    }
  }, [value, disabled]);

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const m = e.target.value;
    setSelectedMonth(m);
    const nextVal = m && selectedYear ? `${selectedYear}-${m}` : "";
    lastEmittedValue.current = nextVal;
    onChange(nextVal);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const y = e.target.value;
    setSelectedYear(y);
    const nextVal = selectedMonth && y ? `${y}-${selectedMonth}` : "";
    lastEmittedValue.current = nextVal;
    onChange(nextVal);
  };

  const isPartial = Boolean((selectedMonth && !selectedYear) || (!selectedMonth && selectedYear));
  const baseId = id || label.toLowerCase().replace(/[^a-z0-9]/g, "-");

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <label className="block text-xs font-semibold text-foreground">
          {label}
        </label>
        {help}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select
          id={`${baseId}-month`}
          aria-label={`${label} month`}
          value={selectedMonth}
          onChange={handleMonthChange}
          disabled={disabled}
          className="w-full text-sm bg-surface-card border border-border rounded-md px-2.5 py-1.5 text-foreground disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">Month</option>
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>

        <select
          id={`${baseId}-year`}
          aria-label={`${label} year`}
          value={selectedYear}
          onChange={handleYearChange}
          disabled={disabled}
          className="w-full text-sm bg-surface-card border border-border rounded-md px-2.5 py-1.5 text-foreground disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">Year</option>
          {YEARS.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {isPartial && !disabled && (
        <p className="text-xs text-amber-600">Choose both month and year</p>
      )}

      {warning && !disabled && (
        <p className="text-xs text-amber-600">{warning}</p>
      )}
    </div>
  );
};
