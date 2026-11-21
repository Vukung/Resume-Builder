import React, { useState, useRef, useEffect } from "react";
import { ResumeSummary } from "../api/types";
import { formatRelativeTime } from "../utils/formatTime";
import { FileText, Copy, Trash2, Edit2, ExternalLink, Check, X } from "lucide-react";

interface ResumeCardProps {
  resume: ResumeSummary;
  onOpen: (id: string) => void;
  onRename: (id: string, newTitle: string) => Promise<void>;
  onDuplicate: (id: string) => Promise<void>;
  onDeleteRequest: (resume: ResumeSummary, triggerEl: HTMLElement | null) => void;
}

export const ResumeCard: React.FC<ResumeCardProps> = ({
  resume,
  onOpen,
  onRename,
  onDuplicate,
  onDeleteRequest,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(resume.title);
  const [isSaving, setIsSaving] = useState(false);
  const deleteBtnRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      setEditTitle(resume.title);
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing, resume.title]);

  const handleSaveRename = async () => {
    const trimmed = editTitle.trim();
    if (!trimmed || trimmed === resume.title) {
      setIsEditing(false);
      setEditTitle(resume.title);
      return;
    }
    setIsSaving(true);
    try {
      await onRename(resume.id, trimmed);
      setIsEditing(false);
    } catch {
      // Revert if error
      setEditTitle(resume.title);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveRename();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsEditing(false);
      setEditTitle(resume.title);
    }
  };

  return (
    <div
      role="article"
      aria-label={`Resume: ${resume.title}`}
      onClick={() => {
        if (!isEditing) onOpen(resume.id);
      }}
      className="group bg-surface-card border border-border hover:border-border-hover rounded-lg p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="w-9 h-9 rounded-md bg-accent-subtle text-accent flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>

          <span className="text-xs text-foreground-subtle pt-1 shrink-0">
            Updated {formatRelativeTime(resume.updatedAt)}
          </span>
        </div>

        <div className="mt-4">
          {isEditing ? (
            <div
              className="flex items-center gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                ref={inputRef}
                type="text"
                value={editTitle}
                maxLength={100}
                disabled={isSaving}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full text-base font-semibold px-2 py-1 border border-accent rounded bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                aria-label="Edit resume title"
              />
              <button
                type="button"
                onClick={handleSaveRename}
                disabled={isSaving}
                className="p-1 text-accent hover:bg-accent-subtle rounded focus:outline-none focus:ring-2 focus:ring-accent"
                aria-label="Save title"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditTitle(resume.title);
                }}
                disabled={isSaving}
                className="p-1 text-foreground-muted hover:bg-surface rounded focus:outline-none focus:ring-2 focus:ring-accent"
                aria-label="Cancel editing"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <h3
              className="font-semibold text-foreground text-base line-clamp-1 group-hover:text-accent transition-colors"
              title={resume.title}
            >
              {resume.title}
            </h3>
          )}
        </div>
      </div>

      <div
        className="mt-6 pt-3 border-t border-border flex items-center justify-between gap-1 text-foreground-muted"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onOpen(resume.id)}
          className="flex items-center gap-1 text-xs font-medium hover:text-accent px-2 py-1 rounded hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
          aria-label={`Open ${resume.title}`}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Open</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="p-1.5 hover:text-foreground rounded hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
            aria-label={`Rename ${resume.title}`}
            title="Rename"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDuplicate(resume.id)}
            className="p-1.5 hover:text-foreground rounded hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
            aria-label={`Duplicate ${resume.title}`}
            title="Duplicate"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            ref={deleteBtnRef}
            type="button"
            onClick={() => onDeleteRequest(resume, deleteBtnRef.current)}
            className="p-1.5 hover:text-destructive rounded hover:bg-destructive-subtle focus:outline-none focus:ring-2 focus:ring-destructive"
            aria-label={`Delete ${resume.title}`}
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
