import React, { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ResumeContent } from "../../api/types";
import { isContentEmpty } from "./isContentEmpty";
import { InfoTooltip } from "../components/InfoTooltip";
import { buildResumeModel } from "../shared/resumeModel";
import { buildPdfFileName } from "../utils/pdfFileName";

interface PreviewToolbarProps {
  content: ResumeContent;
  resumeTitle?: string;
}

export const PreviewToolbar: React.FC<PreviewToolbarProps> = ({ content, resumeTitle }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const empty = isContentEmpty(content);

  const handleDownload = async () => {
    if (empty || isGenerating) return;
    setIsGenerating(true);

    try {
      const [{ pdf }, { ResumePdf }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("../pdf/ResumePdf"),
      ]);

      const model = buildResumeModel(content);
      const blob = await pdf(
        (<ResumePdf model={model} resumeTitle={resumeTitle} /> as unknown) as React.ReactElement<
          import("@react-pdf/renderer").DocumentProps
        >
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = buildPdfFileName(content.basics?.fullName, resumeTitle);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Could not create the PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-[794px] mb-3 flex items-center justify-end shrink-0">
      <div className="inline-flex items-center">
        <button
          type="button"
          onClick={handleDownload}
          disabled={empty || isGenerating}
          aria-busy={isGenerating}
          title={empty ? "Add some content first" : undefined}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface-card border border-border text-foreground hover:bg-surface-hover hover:border-border-hover disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium rounded-md shadow-2xs transition-colors focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
        >
          {isGenerating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-foreground-muted" />
          ) : (
            <Download className="w-3.5 h-3.5 text-foreground-muted" />
          )}
          <span>{isGenerating ? "Preparing PDF..." : "Download PDF"}</span>
        </button>
        <InfoTooltip
          fieldLabel="Download PDF"
          text="Downloads your resume as a PDF file with selectable text that applicant tracking systems can read. Press Ctrl+P or Cmd+P if you prefer your browser's print dialog."
        />
      </div>
    </div>
  );
};
