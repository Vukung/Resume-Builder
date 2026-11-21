import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { api, ApiError } from "../api/client";
import { Resume } from "../api/types";
import { Header } from "../components/Header";
import { formatRelativeTime } from "../utils/formatTime";
import { ArrowLeft, Loader2, Edit2, Check, X, FileQuestion, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const EditorStubPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [resume, setResume] = useState<Resume | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setIsNotFound(false);
    setError(null);

    api
      .getResume(id)
      .then((data) => {
        setResume(data.resume);
        setEditTitle(data.resume.title);
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 404) {
          setIsNotFound(true);
        } else {
          setError(err instanceof Error ? err.message : "Failed to load resume");
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (isEditingTitle) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [isEditingTitle]);

  const handleSaveTitle = async () => {
    if (!resume) return;
    const trimmed = editTitle.trim();
    if (!trimmed || trimmed === resume.title) {
      setIsEditingTitle(false);
      setEditTitle(resume.title);
      return;
    }

    setIsSavingTitle(true);
    try {
      const res = await api.renameResume(resume.id, trimmed);
      setResume((prev) => (prev ? { ...prev, title: res.resume.title, updatedAt: res.resume.updatedAt } : null));
      setIsEditingTitle(false);
      toast.success("Title updated");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update title");
      setEditTitle(resume.title);
    } finally {
      setIsSavingTitle(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveTitle();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsEditingTitle(false);
      if (resume) setEditTitle(resume.title);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
            <span className="text-sm text-foreground-muted">Loading resume...</span>
          </div>
        </div>
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-surface-card border border-border rounded-lg p-8 text-center shadow-xs">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-destructive-subtle text-destructive mb-4">
              <FileQuestion className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Resume not found</h1>
            <p className="text-sm text-foreground-muted mt-2">
              The resume you are looking for does not exist or has been deleted.
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
  }

  if (error || !resume) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-surface-card border border-border rounded-lg p-8 text-center shadow-xs">
            <p className="text-destructive font-medium">{error || "Failed to load resume"}</p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium rounded-md hover:bg-accent-hover transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between gap-4 pb-6 border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground-muted hover:text-foreground px-2 py-1 rounded hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent shrink-0"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>

            <span className="text-border">|</span>

            {isEditingTitle ? (
              <div className="flex items-center gap-1.5 min-w-0">
                <input
                  ref={titleInputRef}
                  type="text"
                  value={editTitle}
                  maxLength={100}
                  disabled={isSavingTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="text-lg font-bold px-2 py-0.5 border border-accent rounded bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  aria-label="Edit resume title"
                />
                <button
                  type="button"
                  onClick={handleSaveTitle}
                  disabled={isSavingTitle}
                  className="p-1 text-accent hover:bg-accent-subtle rounded focus:outline-none focus:ring-2 focus:ring-accent"
                  aria-label="Save title"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingTitle(false);
                    setEditTitle(resume.title);
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
                <h1 className="text-lg sm:text-xl font-bold text-foreground truncate" title={resume.title}>
                  {resume.title}
                </h1>
                <button
                  type="button"
                  onClick={() => setIsEditingTitle(true)}
                  className="p-1 text-foreground-subtle hover:text-foreground rounded hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent shrink-0"
                  aria-label="Rename resume"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="text-xs text-foreground-subtle shrink-0">
            Last updated {formatRelativeTime(resume.updatedAt)}
          </div>
        </div>

        <div className="mt-12 max-w-xl mx-auto text-center py-16 px-6 bg-surface-card border border-border rounded-lg shadow-xs">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent-subtle text-accent mb-4">
            <Sparkles className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Resume Workspace</h2>
          <p className="mt-3 text-base text-foreground-muted">
            The editor arrives in the next phase.
          </p>
          <p className="mt-1 text-xs text-foreground-subtle">
            You will soon be able to edit sections, customize formatting, and preview in real time.
          </p>
        </div>
      </main>
    </div>
  );
};
