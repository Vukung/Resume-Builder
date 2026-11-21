import React, { useRef, useEffect } from "react";
import { InfoTooltip } from "./InfoTooltip";

interface TextAreaFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  maxLength?: number;
  placeholder?: string;
  rows?: number;
  help?: { text: string; example?: string };
  error?: string;
  hint?: string;
}

export const TextAreaField: React.FC<TextAreaFieldProps> = ({
  id,
  label,
  value,
  onChange,
  maxLength = 2000,
  placeholder,
  rows = 4,
  help,
  error,
  hint,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 100)}px`;
  }, [value]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <label htmlFor={id} className="block text-xs font-semibold text-foreground">
          {label}
          {help && <InfoTooltip fieldLabel={label} text={help.text} example={help.example} />}
        </label>
        <span className="text-[11px] text-foreground-subtle">
          {value.length} / {maxLength}
        </span>
      </div>

      <textarea
        ref={textareaRef}
        id={id}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        className={`w-full px-3 py-2 text-sm bg-surface-card border rounded-md text-foreground placeholder:text-foreground-subtle transition-colors resize-none overflow-hidden focus:outline-none focus:ring-2 ${
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
