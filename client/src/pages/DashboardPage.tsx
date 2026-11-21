import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api, ApiError } from "../api/client";
import { ResumeSummary } from "../api/types";
import { Header } from "../components/Header";
import { ResumeCard } from "../components/ResumeCard";
import { NewResumeDialog } from "../components/NewResumeDialog";
import { DeleteConfirmDialog } from "../components/DeleteConfirmDialog";
import { Plus, Search, RefreshCw, FileText } from "lucide-react";

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeQuery, setActiveQuery] = useState("");

  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ResumeSummary | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const newButtonRef = useRef<HTMLButtonElement>(null);
  const deleteTriggerRef = useRef<HTMLElement | null>(null);

  const fetchResumes = useCallback(async (query: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.listResumes(query || undefined);
      setResumes(res.resumes);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to load resumes. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setActiveQuery(searchTerm);
      fetchResumes(searchTerm);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm, fetchResumes]);

  // Pressing "/" focuses search input when not already typing
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (e.key === "/" && !isInput) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const handleCreateResume = async (title: string) => {
    try {
      const res = await api.createResume(title);
      toast.success("Resume created successfully");
      navigate(`/resume/${res.resume.id}`);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 409) {
        toast.error("You can have up to 20 resumes. Delete one to create another.");
      }
      throw err;
    }
  };

  const handleRenameResume = async (id: string, newTitle: string) => {
    try {
      const res = await api.renameResume(id, newTitle);
      setResumes((prev) =>
        prev.map((r) => (r.id === id ? { ...r, title: res.resume.title, updatedAt: res.resume.updatedAt } : r))
      );
      toast.success("Resume renamed");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to rename resume");
      throw err;
    }
  };

  const handleDuplicateResume = async (id: string) => {
    try {
      const res = await api.duplicateResume(id);
      setResumes((prev) => [res.resume, ...prev]);
      toast.success("Resume duplicated");
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 409) {
        toast.error("You can have up to 20 resumes. Delete one to create another.");
      } else {
        toast.error(err instanceof Error ? err.message : "Failed to duplicate resume");
      }
    }
  };

  const handleDeleteResume = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteResume(deleteTarget.id);
      setResumes((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      toast.success("Resume deleted");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete resume");
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Resumes</h1>
            <p className="text-sm text-foreground-muted mt-0.5">Manage and edit your resumes</p>
          </div>

          <button
            ref={newButtonRef}
            onClick={() => setIsNewDialogOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-md shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New resume</span>
          </button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-foreground-subtle">
            <Search className="w-4 h-4" />
          </div>
          <input
            ref={searchInputRef}
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search resumes... (Press / to focus)"
            aria-label="Search resumes"
            className="w-full pl-9 pr-12 py-2 text-sm bg-surface-card border border-border rounded-lg text-foreground placeholder:text-foreground-subtle focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs text-foreground-subtle bg-surface border border-border rounded">
              /
            </kbd>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-surface-card border border-border rounded-lg p-5 h-36 animate-pulse flex flex-col justify-between"
              >
                <div className="flex justify-between items-start">
                  <div className="w-9 h-9 rounded-md bg-surface" />
                  <div className="w-20 h-3 bg-surface rounded" />
                </div>
                <div className="w-3/4 h-5 bg-surface rounded mt-4" />
                <div className="w-full h-4 bg-surface rounded mt-4" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-surface-card border border-border rounded-lg p-6">
            <p className="text-destructive font-medium">{error}</p>
            <button
              onClick={() => fetchResumes(activeQuery)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-accent bg-accent-subtle rounded-md hover:bg-accent hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>
          </div>
        ) : resumes.length === 0 ? (
          activeQuery ? (
            <div className="text-center py-16 bg-surface-card border border-border rounded-lg p-6">
              <p className="text-foreground font-medium">No results found</p>
              <p className="text-sm text-foreground-muted mt-1">
                No resumes found matching &ldquo;{activeQuery}&rdquo;. Try another search term.
              </p>
            </div>
          ) : (
            <div className="text-center py-16 bg-surface-card border border-dashed border-border rounded-lg p-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent-subtle text-accent mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">No resumes yet</h3>
              <p className="text-sm text-foreground-muted mt-1 max-w-sm mx-auto">
                Create your first resume to start showcasing your experience and projects.
              </p>
              <button
                onClick={() => setIsNewDialogOpen(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create resume</span>
              </button>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resumes.map((resume) => (
              <ResumeCard
                key={resume.id}
                resume={resume}
                onOpen={(id) => navigate(`/resume/${id}`)}
                onRename={handleRenameResume}
                onDuplicate={handleDuplicateResume}
                onDeleteRequest={(item, el) => {
                  deleteTriggerRef.current = el;
                  setDeleteTarget(item);
                }}
              />
            ))}
          </div>
        )}
      </main>

      <NewResumeDialog
        isOpen={isNewDialogOpen}
        onClose={() => setIsNewDialogOpen(false)}
        onCreate={handleCreateResume}
        triggerRef={newButtonRef}
      />

      <DeleteConfirmDialog
        isOpen={!!deleteTarget}
        resumeTitle={deleteTarget?.title || ""}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteResume}
        triggerRef={deleteTriggerRef}
      />
    </div>
  );
};
