import React, { useState } from "react";
import { useOptionalAuth } from "../context/useAuth";
import { ApiError } from "../api/client";
import { Loader2, AlertCircle } from "lucide-react";

export const TryDemoButton: React.FC = () => {
  const auth = useOptionalAuth();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (isPending || !auth) return;
    setError(null);
    setIsPending(true);
    try {
      await auth.startDemo();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Network error. Could not connect to server.");
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="w-full text-center">
      <p className="text-xs text-foreground-muted mb-2">Looking around? No signup needed.</p>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-border bg-surface hover:bg-surface-hover text-foreground text-sm font-medium rounded-md transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-accent"
      >
        {isPending && <Loader2 className="w-4 h-4 animate-spin text-accent" />}
        <span>{isPending ? "Setting up your demo..." : "Try a demo with a sample resume"}</span>
      </button>
      {error && (
        <div
          role="alert"
          className="mt-2 p-2.5 rounded-md bg-destructive-subtle border border-destructive/20 text-destructive text-xs flex items-start gap-2 text-left"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
