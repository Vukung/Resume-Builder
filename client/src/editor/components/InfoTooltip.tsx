import React, { useState, useRef, useEffect, useId } from "react";
import { Info } from "lucide-react";

interface InfoTooltipProps {
  fieldLabel: string;
  text: string;
  example?: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ fieldLabel, text, example }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const justFocusedRef = useRef(false);
  const tooltipId = useId();
  const [placementStyle, setPlacementStyle] = useState<React.CSSProperties>({ left: 0 });

  const handleFocus = () => {
    setIsOpen(true);
    justFocusedRef.current = true;
    setTimeout(() => {
      justFocusedRef.current = false;
    }, 200);
  };

  const handleClick = () => {
    if (justFocusedRef.current) {
      justFocusedRef.current = false;
      return;
    }
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!isOpen) return;

    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      if (rect.left + 280 > viewportWidth - 16) {
        setPlacementStyle({ right: 0, left: "auto" });
      } else {
        setPlacementStyle({ left: 0, right: "auto" });
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        btnRef.current?.focus();
      }
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative inline-flex items-center ml-1.5 align-middle">
      <button
        ref={btnRef}
        type="button"
        aria-label={`More information about ${fieldLabel}`}
        aria-describedby={isOpen ? tooltipId : undefined}
        onClick={handleClick}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={handleFocus}
        onBlur={(e) => {
          if (!containerRef.current?.contains(e.relatedTarget as Node)) {
            setIsOpen(false);
          }
        }}
        className="text-foreground-subtle hover:text-foreground focus:outline-none focus:ring-2 focus:ring-accent rounded-full p-0.5"
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div
          id={tooltipId}
          role="tooltip"
          style={placementStyle}
          className="absolute top-full mt-1.5 z-50 w-72 max-w-[280px] bg-foreground text-white text-xs rounded-md p-2.5 shadow-xl pointer-events-auto leading-relaxed"
        >
          <p>{text}</p>
          {example && (
            <p className="italic text-slate-300 mt-1.5 border-t border-slate-700 pt-1">
              Example: &ldquo;{example}&rdquo;
            </p>
          )}
        </div>
      )}
    </div>
  );
};
