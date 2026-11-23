import React, { useState } from "react";
import { useOptionalAuth } from "../context/useAuth";
import { Sparkles, Loader2 } from "lucide-react";

export const DemoBanner: React.FC = () => {
  const auth = useOptionalAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!auth?.user?.isDemo) {
    return null;
  }

  const handleCreateAccount = async () => {
    setIsLoggingOut(true);
    try {
      await auth.logout("/signup");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div
      role="status"
      className="bg-accent-subtle border-b border-accent/20 px-4 py-2 text-xs sm:text-sm text-foreground shrink-0 z-10"
    >
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent shrink-0 hidden sm:inline-block" />
          <span>
            You are using a temporary demo account with fictional sample data. It is deleted after 24 hours.
          </span>
        </div>
        <button
          type="button"
          onClick={handleCreateAccount}
          disabled={isLoggingOut}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 shrink-0 disabled:opacity-50"
        >
          {isLoggingOut && <Loader2 className="w-3 h-3 animate-spin" />}
          <span>Create a real account</span>
        </button>
      </div>
    </div>
  );
};
