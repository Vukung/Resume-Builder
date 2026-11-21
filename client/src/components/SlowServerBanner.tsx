import React, { useEffect, useState } from "react";
import { subscribeSlowServer } from "../api/client";
import { Loader2 } from "lucide-react";

export const SlowServerBanner: React.FC = () => {
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    return subscribeSlowServer((slow) => {
      setIsSlow(slow);
    });
  }, []);

  if (!isSlow) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-accent-subtle text-accent border-b border-border py-2 px-4 text-center text-sm font-medium flex items-center justify-center gap-2 animate-fadeIn"
    >
      <Loader2 className="w-4 h-4 animate-spin text-accent" />
      <span>Waking up the server, this can take up to a minute.</span>
    </div>
  );
};
