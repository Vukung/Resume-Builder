import React from "react";
import { Printer } from "lucide-react";
import { ResumeContent } from "../../api/types";
import { isContentEmpty } from "./isContentEmpty";
import { InfoTooltip } from "../components/InfoTooltip";

interface PreviewToolbarProps {
  content: ResumeContent;
}

export const PreviewToolbar: React.FC<PreviewToolbarProps> = ({ content }) => {
  const empty = isContentEmpty(content);

  const handlePrint = async () => {
    if (empty) return;
    try {
      if (typeof document !== "undefined" && document.fonts && document.fonts.ready) {
        await Promise.race([
          document.fonts.ready,
          new Promise((resolve) => setTimeout(resolve, 2000)),
        ]);
      }
    } catch {
      // Continue even if fonts.ready fails
    }
    window.print();
  };

  return (
    <div className="w-full max-w-[794px] mb-3 flex items-center justify-end shrink-0">
      <div className="inline-flex items-center">
        <button
          type="button"
          onClick={handlePrint}
          disabled={empty}
          title={empty ? "Add some content first" : undefined}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface-card border border-border text-foreground hover:bg-surface-hover hover:border-border-hover disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium rounded-md shadow-2xs transition-colors focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5 text-foreground-muted" />
          <span>Print or save as PDF</span>
        </button>
        <InfoTooltip
          fieldLabel="Print or save as PDF"
          text="Your browser's print dialog opens. Choose Save as PDF as the destination. In Chrome and Edge no extra settings are needed. In other browsers, if a date or web address appears at the top or bottom, turn off Headers and footers in the print settings."
        />
      </div>
    </div>
  );
};
