import React, { useRef, useState, useEffect } from "react";
import { ResumeContent } from "../../api/types";
import { ResumeDocument } from "./ResumeDocument";
import { PreviewToolbar } from "./PreviewToolbar";

interface PreviewPaneProps {
  content: ResumeContent;
  resumeTitle?: string;
}

const SHEET_WIDTH_PX = 794; // 210mm at 96 DPI

export const PreviewPane: React.FC<PreviewPaneProps> = ({ content, resumeTitle }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const container = containerRef.current;
    const sheet = sheetRef.current;
    if (!container || !sheet) return;

    const updateDimensions = (entries?: ResizeObserverEntry[]) => {
      let sheetHeight = sheet.offsetHeight;
      let containerWidth = container.clientWidth;

      if (entries) {
        for (const entry of entries) {
          if (entry.target === sheet) {
            sheetHeight =
              entry.borderBoxSize?.[0]?.blockSize ??
              entry.contentRect?.height ??
              (entry.target as HTMLElement).offsetHeight;
          } else if (entry.target === container) {
            containerWidth =
              entry.borderBoxSize?.[0]?.inlineSize ??
              entry.contentRect?.width ??
              (entry.target as HTMLElement).clientWidth;
          }
        }
      }

      const currentScale = containerWidth > 0 ? Math.min(1, containerWidth / SHEET_WIDTH_PX) : 1;
      setScale(currentScale);
      setScaledHeight(sheetHeight * currentScale);
    };

    updateDimensions();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver((entries) => {
        updateDimensions(entries);
      });
      observer.observe(container);
      observer.observe(sheet);
      return () => observer.disconnect();
    } else {
      window.addEventListener("resize", () => updateDimensions());
      return () => window.removeEventListener("resize", () => updateDimensions());
    }
  }, [content]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-y-auto bg-surface p-4 flex flex-col items-center"
      aria-label="Resume live preview"
    >
      <PreviewToolbar content={content} resumeTitle={resumeTitle} />
      <div
        data-testid="preview-scale-wrapper"
        style={{
          width: SHEET_WIDTH_PX * scale,
          height: scaledHeight !== undefined ? scaledHeight : "auto",
          position: "relative",
        }}
        className="shadow-md rounded-xs transition-all"
      >
        <div
          ref={sheetRef}
          data-testid="preview-sheet"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            width: SHEET_WIDTH_PX,
          }}
        >
          <ResumeDocument content={content} />
        </div>
      </div>
    </div>
  );
};
