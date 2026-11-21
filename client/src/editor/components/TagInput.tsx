import React, { useState, ReactNode, KeyboardEvent, ClipboardEvent } from "react";
import { X } from "lucide-react";

interface TagInputProps {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  maxCount: number;
  maxTagLength: number;
  placeholder?: string;
  help?: ReactNode;
  id?: string;
}

export const TagInput: React.FC<TagInputProps> = ({
  label,
  tags,
  onChange,
  maxCount,
  maxTagLength,
  placeholder = "Type and press Enter or comma",
  help,
  id,
}) => {
  const [inputValue, setInputValue] = useState("");
  const inputId = id || label.toLowerCase().replace(/[^a-z0-9]/g, "-");

  const addTag = (rawText: string) => {
    const trimmed = rawText.trim().slice(0, maxTagLength);
    if (!trimmed) return false;
    if (tags.length >= maxCount) return false;

    const lower = trimmed.toLowerCase();
    if (tags.some((t) => t.toLowerCase() === lower)) {
      return false; // ignore duplicate case-insensitive
    }

    onChange([...tags, trimmed]);
    return true;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
        setInputValue("");
      }
    } else if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
      e.preventDefault();
      onChange(tags.slice(0, -1));
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addTag(inputValue);
      setInputValue("");
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text");
    if (pasted.includes(",")) {
      e.preventDefault();
      const parts = pasted.split(",");
      const currentTags = [...tags];
      let changed = false;

      for (const part of parts) {
        if (currentTags.length >= maxCount) break;
        const trimmed = part.trim().slice(0, maxTagLength);
        if (!trimmed) continue;
        const lower = trimmed.toLowerCase();
        if (!currentTags.some((t) => t.toLowerCase() === lower)) {
          currentTags.push(trimmed);
          changed = true;
        }
      }

      if (changed) {
        onChange(currentTags);
      }
      setInputValue("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((t) => t !== tagToRemove));
  };

  const showCounter = tags.length >= maxCount - 5;
  const isFull = tags.length >= maxCount;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <label htmlFor={inputId} className="block text-xs font-semibold text-foreground">
            {label}
          </label>
          {help}
        </div>
        {showCounter && (
          <span className="text-2xs text-foreground-muted">
            {tags.length}/{maxCount}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 p-2 bg-surface-card border border-border rounded-md min-h-[42px] focus-within:ring-2 focus-within:ring-accent">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-surface border border-border rounded text-foreground shrink-0"
          >
            <span className="truncate max-w-[150px]">{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(tag)}
              aria-label={`Remove ${tag}`}
              className="p-0.5 text-foreground-muted hover:text-foreground rounded focus:outline-none"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        <input
          id={inputId}
          type="text"
          value={inputValue}
          maxLength={maxTagLength}
          disabled={isFull}
          placeholder={tags.length === 0 ? placeholder : isFull ? "" : "Add more..."}
          onChange={(e) => {
            const val = e.target.value;
            if (val.includes(",")) {
              const [first] = val.split(",");
              if (first?.trim()) {
                addTag(first);
              }
              setInputValue("");
            } else {
              setInputValue(val);
            }
          }}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onPaste={handlePaste}
          className="flex-1 min-w-[120px] bg-transparent text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
};
