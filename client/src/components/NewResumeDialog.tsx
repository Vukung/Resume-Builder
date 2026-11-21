import React, { useState, useEffect, useRef } from "react";
import { Loader2, X } from "lucide-react";

interface NewResumeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string) => Promise<void>;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export const NewResumeDialog: React.FC<NewResumeDialogProps> = ({
  isOpen,
  onClose,
  onCreate,
  triggerRef,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      setTitle("");
      setError(null);
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
      triggerRef?.current?.focus();
    }
  }, [isOpen, triggerRef]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Title cannot be empty");
      return;
    }
    if (trimmed.length > 100) {
      setError("Title must be 100 characters or fewer");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onCreate(trimmed);
      onClose();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "message" in err) {
        setError((err as { message: string }).message);
      } else {
        setError("Failed to create resume");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="backdrop:bg-black/40 backdrop:backdrop-blur-xs p-0 bg-transparent rounded-lg shadow-xl w-full max-w-md m-auto border-0"
    >
      <div className="bg-surface-card border border-border rounded-lg p-6 w-full text-foreground">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">New Resume</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-foreground-subtle hover:text-foreground rounded-md p-1 focus:outline-none focus:ring-2 focus:ring-accent"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="resume-title" className="block text-sm font-medium text-foreground mb-1">
              Resume Title
            </label>
            <input
              id="resume-title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Software Engineer 2026"
              maxLength={100}
              autoFocus
              className="w-full px-3 py-2 border border-border rounded-md bg-surface text-foreground placeholder:text-foreground-subtle focus:outline-none focus:ring-2 focus:ring-accent text-sm"
              disabled={isSubmitting}
            />
            <div className="flex justify-between items-center mt-1">
              {error ? (
                <span className="text-xs text-destructive">{error}</span>
              ) : (
                <span className="text-xs text-foreground-muted">1 to 100 characters</span>
              )}
              <span className="text-xs text-foreground-subtle">{title.trim().length}/100</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-surface rounded-md border border-border transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-md transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Create</span>
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
};
