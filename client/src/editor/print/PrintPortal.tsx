import React from "react";
import { createPortal } from "react-dom";
import { ResumeContent } from "../../api/types";
import { ResumeDocument } from "../preview/ResumeDocument";

interface PrintPortalProps {
  content: ResumeContent;
  isPrinting?: boolean;
  printing?: boolean;
}

export const PrintPortal: React.FC<PrintPortalProps> = ({
  content,
  isPrinting,
  printing,
}) => {
  const active = printing ?? isPrinting ?? false;
  if (!active) return null;

  const printRoot = document.getElementById("print-root");
  if (!printRoot) return null;

  return createPortal(<ResumeDocument content={content} />, printRoot);
};
