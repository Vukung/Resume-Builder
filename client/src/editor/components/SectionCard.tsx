import React, { useState, ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface SectionCardProps {
  title: string;
  defaultExpanded?: boolean;
  children: ReactNode;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  defaultExpanded = true,
  children,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="bg-surface-card border border-border rounded-lg shadow-xs overflow-hidden mb-4 transition-all">
      <div className="flex items-center justify-between p-4 border-b border-border bg-surface-card select-none">
        <h2 className="text-base font-bold text-foreground">{title}</h2>
        <button
          type="button"
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-center gap-1 text-xs font-medium text-foreground-muted hover:text-foreground p-1 rounded hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <span>{isExpanded ? "Collapse" : "Expand"}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && <div className="p-4 space-y-4">{children}</div>}
    </div>
  );
};
