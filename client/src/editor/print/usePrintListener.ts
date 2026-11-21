import { useState, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { ResumeContent } from "../../api/types";
import { isChromiumBased } from "./isChromiumBased";

function injectPageRule(): void {
  const existing = document.getElementById("print-page-rule");
  if (existing) {
    existing.remove();
  }

  const style = document.createElement("style");
  style.id = "print-page-rule";
  style.textContent = isChromiumBased()
    ? "@page { size: A4; margin: 0; }"
    : "@page { size: A4; margin: 14mm 16mm; }";
  document.head.appendChild(style);
}

function removePageRule(): void {
  const existing = document.getElementById("print-page-rule");
  if (existing) {
    existing.remove();
  }
}

export function usePrintListener(content: ResumeContent | null, resumeTitle: string) {
  const [isPrinting, setIsPrinting] = useState(false);
  const contentRef = useRef(content);
  const titleRef = useRef(resumeTitle);

  contentRef.current = content;
  titleRef.current = resumeTitle;

  useEffect(() => {
    let originalTitle = "";

    const handleBeforePrint = () => {
      injectPageRule();

      originalTitle = document.title;
      const currentContent = contentRef.current;
      const currentTitle = titleRef.current;
      const fullName = currentContent?.basics?.fullName?.trim();
      const titleName = fullName || currentTitle?.trim() || "Resume";
      document.title = `${titleName} - Resume`;

      flushSync(() => {
        setIsPrinting(true);
      });
    };

    const handleAfterPrint = () => {
      removePageRule();
      setIsPrinting(false);
      if (originalTitle) {
        document.title = originalTitle;
      }
    };

    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      removePageRule();
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, []);

  return isPrinting;
}
