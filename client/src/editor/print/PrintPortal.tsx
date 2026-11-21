import React from "react";
import { createPortal } from "react-dom";
import { ResumeContent } from "../../api/types";
import { ResumeDocument } from "../preview/ResumeDocument";
import { isChromiumBased } from "./isChromiumBased";

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

  const isChromium = isChromiumBased();

  const printContent = isChromium ? (
    <table className="print-frame">
      <thead>
        <tr>
          <td>
            <div className="print-spacer" />
          </td>
        </tr>
      </thead>
      <tfoot>
        <tr>
          <td>
            <div className="print-spacer" />
          </td>
        </tr>
      </tfoot>
      <tbody>
        <tr>
          <td className="print-body">
            <ResumeDocument content={content} />
          </td>
        </tr>
      </tbody>
    </table>
  ) : (
    <ResumeDocument content={content} />
  );

  return createPortal(printContent, printRoot);
};
