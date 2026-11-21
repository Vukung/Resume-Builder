import React from "react";
import { useAuth } from "../context/useAuth";
import { Rocket, LogOut, User as UserIcon } from "lucide-react";
import { Link } from "react-router-dom";

export const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-surface-card border-b border-border sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2.5 font-bold text-lg text-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent rounded-md px-1 py-0.5"
        >
          <div className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center">
            <Rocket className="w-4 h-4" />
          </div>
          <span>Resume Rocket</span>
        </Link>

        {user && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-foreground-muted bg-surface px-3 py-1.5 rounded-full border border-border">
              <UserIcon className="w-4 h-4 text-foreground-subtle" />
              <span className="font-medium text-foreground">{user.name}</span>
            </div>
            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 text-sm font-medium text-foreground-muted hover:text-destructive hover:bg-destructive-subtle px-3 py-1.5 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-destructive"
              aria-label="Log out"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
