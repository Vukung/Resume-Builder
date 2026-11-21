import React, { useEffect, useRef, useState } from "react";
import { Loader2, AlertTriangle, X } from "lucide-react";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  resumeTitle: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  resumeTitle,
  onClose,
  onConfirm,
  triggerRef,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
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

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="backdrop:bg-black/40 backdrop:backdrop-blur-xs p-0 bg-transparent rounded-lg shadow-xl w-full max-w-md m-auto border-0"
    >
      <div className="bg-surface-card border border-border rounded-lg p-6 w-full text-foreground">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Delete Resume</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-foreground-subtle hover:text-foreground rounded-md p-1 focus:outline-none focus:ring-2 focus:ring-accent"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-4 text-sm text-foreground-muted">
          Are you sure you want to delete <span className="font-semibold text-foreground">&ldquo;{resumeTitle}&rdquo;</span>? This action cannot be undone.
        </p>

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-surface rounded-md border border-border transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-destructive hover:bg-destructive-hover rounded-md transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2"
          >
            {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Delete</span>
          </button>
        </div>
      </div>
    </dialog>
  );
};
