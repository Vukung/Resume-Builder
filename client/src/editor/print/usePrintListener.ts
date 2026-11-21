import { useState, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { ResumeContent } from "../../api/types";

export function usePrintListener(content: ResumeContent | null, resumeTitle: string) {
  const [isPrinting, setIsPrinting] = useState(false);
  const contentRef = useRef(content);
  const titleRef = useRef(resumeTitle);

  contentRef.current = content;
  titleRef.current = resumeTitle;

  useEffect(() => {
    let originalTitle = "";

    const handleBeforePrint = () => {
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
      setIsPrinting(false);
      if (originalTitle) {
        document.title = originalTitle;
      }
    };

    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, []);

  return isPrinting;
}
