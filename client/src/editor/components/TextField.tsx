import React from "react";
import { InfoTooltip } from "./InfoTooltip";

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  maxLength?: number;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  help?: { text: string; example?: string };
  error?: string;
  hint?: string;
}

export const TextField: React.FC<TextFieldProps> = ({
  id,
  label,
  value,
  onChange,
  maxLength,
  type = "text",
  placeholder,
  autoComplete,
  help,
  error,
  hint,
}) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <label htmlFor={id} className="block text-xs font-semibold text-foreground">
          {label}
          {help && <InfoTooltip fieldLabel={label} text={help.text} example={help.example} />}
        </label>
        {maxLength && (
          <span className="text-[11px] text-foreground-subtle">
            {value.length}/{maxLength}
          </span>
        )}
      </div>

      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`w-full px-3 py-2 text-sm bg-surface-card border rounded-md text-foreground placeholder:text-foreground-subtle transition-colors focus:outline-none focus:ring-2 ${
          error
            ? "border-destructive focus:ring-destructive"
            : "border-border focus:ring-accent"
        }`}
      />

      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      {hint && <p className="mt-0.5 text-[11px] text-foreground-muted">{hint}</p>}
    </div>
  );
};
