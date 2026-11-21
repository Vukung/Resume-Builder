import React, { useRef, useState, useEffect } from "react";
import { ResumeContent } from "../../api/types";
import { ResumeDocument } from "./ResumeDocument";
import { PreviewToolbar } from "./PreviewToolbar";

interface PreviewPaneProps {
  content: ResumeContent;
}

const SHEET_WIDTH_PX = 794; // 210mm at 96 DPI

export const PreviewPane: React.FC<PreviewPaneProps> = ({ content }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const container = containerRef.current;
    const sheet = sheetRef.current;
    if (!container || !sheet) return;

    const updateScale = () => {
      const containerWidth = container.clientWidth;
      if (containerWidth <= 0) return;

      const currentScale = Math.min(1, containerWidth / SHEET_WIDTH_PX);
      setScale(currentScale);

      const naturalHeight = sheet.offsetHeight;
      setScaledHeight(naturalHeight * currentScale);
    };

    updateScale();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => {
        updateScale();
      });
      observer.observe(container);
      observer.observe(sheet);
      return () => observer.disconnect();
    } else {
      window.addEventListener("resize", updateScale);
      return () => window.removeEventListener("resize", updateScale);
    }
  }, [content]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-y-auto bg-surface p-4 flex flex-col items-center"
      aria-label="Resume live preview"
    >
      <PreviewToolbar content={content} />
      <div
        style={{
          width: SHEET_WIDTH_PX * scale,
          height: scaledHeight !== undefined ? scaledHeight : "auto",
          position: "relative",
          overflow: "hidden",
        }}
        className="shadow-md rounded-xs transition-all"
      >
        <div
          ref={sheetRef}
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
