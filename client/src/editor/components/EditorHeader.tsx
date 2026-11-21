import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Check, Edit2, Loader2, X } from "lucide-react";
import { SaveStatus } from "../hooks/useEditorState";

interface EditorHeaderProps {
  title: string;
  saveState: SaveStatus;
  retryCount: number;
  onRenameTitle: (newTitle: string) => Promise<void>;
  onBack: () => Promise<void>;
  onRetryNow: () => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  title,
  saveState,
  retryCount,
  onRenameTitle,
  onBack,
  onRetryNow,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditTitle(title);
  }, [title]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleSaveRename = async () => {
    const trimmed = editTitle.trim();
    if (!trimmed || trimmed === title) {
      setIsEditing(false);
      setEditTitle(title);
      return;
    }
    setIsSavingTitle(true);
    try {
      await onRenameTitle(trimmed);
      setIsEditing(false);
    } catch {
      setEditTitle(title);
    } finally {
      setIsSavingTitle(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveRename();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsEditing(false);
      setEditTitle(title);
    }
  };

  const renderSaveStatus = () => {
    switch (saveState) {
      case "saving":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-foreground-muted">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
            <span>Saving...</span>
          </span>
        );
      case "dirty":
        return <span className="text-xs text-foreground-subtle">Unsaved changes</span>;
      case "error":
        if (retryCount <= 3) {
          return (
            <span className="text-xs text-destructive font-medium">
              Could not save. Retrying...
            </span>
          );
        }
        return (
          <div className="flex items-center gap-2">
            <span className="text-xs text-destructive font-medium">Could not save.</span>
            <button
              type="button"
              onClick={onRetryNow}
              className="text-xs font-semibold text-accent underline hover:text-accent-hover focus:outline-none focus:ring-1 focus:ring-accent rounded px-1"
            >
              Retry now
            </button>
          </div>
        );
      case "saved":
      default:
        return <span className="text-xs text-foreground-muted font-medium">Saved</span>;
    }
  };

  return (
    <header className="bg-surface-card border-b border-border h-16 px-4 sm:px-6 flex items-center justify-between shrink-0 z-20">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground-muted hover:text-foreground px-2 py-1 rounded hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent shrink-0"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <span className="text-border">|</span>

        {isEditing ? (
          <div className="flex items-center gap-1.5 min-w-0">
            <input
              ref={inputRef}
              type="text"
              value={editTitle}
              maxLength={100}
              disabled={isSavingTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSaveRename}
              className="text-base font-bold px-2 py-0.5 border border-accent rounded bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              aria-label="Edit resume title"
            />
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSaveRename();
              }}
              disabled={isSavingTitle}
              className="p-1 text-accent hover:bg-accent-subtle rounded focus:outline-none focus:ring-2 focus:ring-accent"
              aria-label="Save title"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setIsEditing(false);
                setEditTitle(title);
              }}
              disabled={isSavingTitle}
              className="p-1 text-foreground-muted hover:bg-surface rounded focus:outline-none focus:ring-2 focus:ring-accent"
              aria-label="Cancel editing"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-foreground truncate" title={title}>
              {title}
            </h1>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="p-1 text-foreground-subtle hover:text-foreground rounded hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent shrink-0"
              aria-label="Rename resume"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="shrink-0 ml-3" aria-live="polite">
        {renderSaveStatus()}
      </div>
    </header>
  );
};
