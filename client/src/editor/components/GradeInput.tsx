import React, { useState, useEffect, useRef, ReactNode } from "react";

interface GradeInputProps {
  gradeType: "percentage" | "cgpa";
  gradeValue: number | null;
  onGradeTypeChange?: (type: "percentage" | "cgpa") => void;
  onGradeValueChange?: (val: number | null) => void;
  onChange?: (type: "percentage" | "cgpa", val: number | null) => void;
  help?: ReactNode;
}

export const GradeInput: React.FC<GradeInputProps> = ({
  gradeType,
  gradeValue,
  onGradeTypeChange,
  onGradeValueChange,
  onChange,
  help,
}) => {
  const [rawText, setRawText] = useState<string>(() =>
    gradeValue !== null ? String(gradeValue) : ""
  );
  const lastEmittedValue = useRef<number | null>(gradeValue);

  const validate = (text: string, type: "percentage" | "cgpa") => {
    const trimmed = text.trim();
    if (!trimmed) {
      return { error: null, num: null };
    }
    const n = Number(trimmed);
    const max = type === "percentage" ? 100 : 10;
    const msg =
      type === "percentage"
        ? "Enter a number between 0 and 100"
        : "Enter a number between 0 and 10";

    if (isNaN(n) || !Number.isFinite(n) || n < 0 || n > max) {
      return { error: msg, num: null };
    }
    return { error: null, num: n };
  };

  const { error } = validate(rawText, gradeType);

  useEffect(() => {
    if (gradeValue !== lastEmittedValue.current) {
      lastEmittedValue.current = gradeValue;
      if (gradeValue === null) {
        setRawText("");
      } else {
        setRawText(String(gradeValue));
      }
    }
  }, [gradeValue]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextText = e.target.value;
    setRawText(nextText);
    const { num } = validate(nextText, gradeType);
    lastEmittedValue.current = num;
    if (onChange) {
      onChange(gradeType, num);
    } else {
      onGradeValueChange?.(num);
    }
  };

  const handleTypeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextType = e.target.value as "percentage" | "cgpa";
    const { num } = validate(rawText, nextType);
    lastEmittedValue.current = num;
    if (onChange) {
      onChange(nextType, num);
    } else {
      onGradeTypeChange?.(nextType);
      if (num !== gradeValue) {
        onGradeValueChange?.(num);
      }
    }
  };

  const trimmed = rawText.trim();
  const numVal = Number(trimmed);
  const showCgpaHint =
    gradeType === "percentage" &&
    trimmed !== "" &&
    !isNaN(numVal) &&
    Number.isFinite(numVal) &&
    numVal > 0 &&
    numVal < 10;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <label htmlFor="grade-value-input" className="block text-xs font-semibold text-foreground">
          Grade
        </label>
        {help}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select
          aria-label="Grade type"
          value={gradeType}
          onChange={handleTypeSelect}
          className="w-full text-sm bg-surface-card border border-border rounded-md px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="percentage">Percentage</option>
          <option value="cgpa">CGPA</option>
        </select>

        <input
          id="grade-value-input"
          type="text"
          inputMode="decimal"
          value={rawText}
          placeholder={gradeType === "percentage" ? "e.g. 85" : "e.g. 8.5"}
          aria-label="Grade value"
          onChange={handleTextChange}
          className={`w-full text-sm bg-surface-card border rounded-md px-3 py-1.5 text-foreground focus:outline-none focus:ring-2 ${
            error
              ? "border-destructive focus:ring-destructive"
              : "border-border focus:ring-accent"
          }`}
        />
      </div>

      {showCgpaHint && (
        <p className="text-xs text-foreground-muted mt-1">
          That looks like a CGPA. Switch the grade type to CGPA if it is out of 10.
        </p>
      )}

      {error && (
        <div className="text-xs space-y-0.5 mt-1">
          <p className="text-destructive font-medium">{error}</p>
          <p className="text-foreground-muted">Not saved until valid</p>
        </div>
      )}
    </div>
  );
};
