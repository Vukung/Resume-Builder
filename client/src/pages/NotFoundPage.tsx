import React from "react";
import { Link } from "react-router-dom";
import { Header } from "../components/Header";
import { FileQuestion, ArrowLeft } from "lucide-react";

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-surface-card border border-border rounded-lg p-8 text-center shadow-xs">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent-subtle text-accent mb-4">
            <FileQuestion className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">404 - Page Not Found</h1>
          <p className="text-sm text-foreground-muted mt-2">
            The page you are looking for does not exist or has been moved.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
