import React, { useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useEditorState } from "../editor/hooks/useEditorState";
import { EditorHeader } from "../editor/components/EditorHeader";
import { BasicsForm } from "../editor/forms/BasicsForm";
import { SummaryForm } from "../editor/forms/SummaryForm";
import { EducationForm } from "../editor/forms/EducationForm";
import { SkillsForm } from "../editor/forms/SkillsForm";
import { ExperienceForm } from "../editor/forms/ExperienceForm";
import { ProjectsForm } from "../editor/forms/ProjectsForm";
import { CertificationsForm } from "../editor/forms/CertificationsForm";
import { PreviewPane } from "../editor/preview/PreviewPane";
import { PrintPortal } from "../editor/print/PrintPortal";
import { usePrintListener } from "../editor/print/usePrintListener";
import "../editor/print/print.css";
import { Loader2, FileQuestion, ArrowLeft, Edit3, Eye } from "lucide-react";

export const EditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const editTabRef = useRef<HTMLButtonElement>(null);
  const previewTabRef = useRef<HTMLButtonElement>(null);

  const { state, updateContent, flush, retryNow, renameTitle } = useEditorState(id || "");
  const isPrinting = usePrintListener(state.content, state.title);

  const handleBack = async () => {
    if (state.saveState !== "saved") {
      const ok = await flush();
      if (!ok) {
        const proceed = window.confirm("You have unsaved changes. Are you sure you want to leave?");
        if (!proceed) return;
      }
    }
    navigate("/");
  };

  const handleTabKeyDown = (e: React.KeyboardEvent, currentTab: "edit" | "preview") => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const target = currentTab === "edit" ? "preview" : "edit";
      setActiveTab(target);
      if (target === "edit") {
        editTabRef.current?.focus();
      } else {
        previewTabRef.current?.focus();
      }
    }
  };

  if (state.loadStatus === "loading") {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <span className="text-sm text-foreground-muted">Loading resume...</span>
        </div>
      </div>
    );
  }

  if (state.loadStatus === "notFound") {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
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
    );
  }

  if (state.loadStatus === "error" || !state.content) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-surface-card border border-border rounded-lg p-8 text-center shadow-xs">
          <p className="text-destructive font-medium">{state.errorMessage || "Failed to load resume"}</p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium rounded-md hover:bg-accent-hover transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col h-screen overflow-hidden">
      {state.content && <PrintPortal content={state.content} isPrinting={isPrinting} />}
      <EditorHeader
        title={state.title}
        saveState={state.saveState}
        retryCount={state.retryCount}
        onRenameTitle={renameTitle}
        onBack={handleBack}
        onRetryNow={retryNow}
      />

      {/* Mobile Tab Bar (< 1024px) */}
      <div className="lg:hidden bg-surface-card border-b border-border px-4 py-2 flex justify-center shrink-0">
        <div role="tablist" aria-label="Editor views" className="flex bg-surface p-1 rounded-lg border border-border">
          <button
            ref={editTabRef}
            id="tab-edit"
            role="tab"
            type="button"
            aria-selected={activeTab === "edit"}
            aria-controls="panel-edit"
            tabIndex={activeTab === "edit" ? 0 : -1}
            onClick={() => setActiveTab("edit")}
            onKeyDown={(e) => handleTabKeyDown(e, "edit")}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-accent ${
              activeTab === "edit"
                ? "bg-surface-card text-foreground shadow-xs"
                : "text-foreground-muted hover:text-foreground"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>

          <button
            ref={previewTabRef}
            id="tab-preview"
            role="tab"
            type="button"
            aria-selected={activeTab === "preview"}
            aria-controls="panel-preview"
            tabIndex={activeTab === "preview" ? 0 : -1}
            onClick={() => setActiveTab("preview")}
            onKeyDown={(e) => handleTabKeyDown(e, "preview")}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-accent ${
              activeTab === "preview"
                ? "bg-surface-card text-foreground shadow-xs"
                : "text-foreground-muted hover:text-foreground"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>
        </div>
      </div>

      {/* Main Workspace: 2-column on >=1024px */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        <div
          id="panel-edit"
          role="tabpanel"
          aria-labelledby="tab-edit"
          className={`h-full overflow-y-auto p-4 sm:p-6 w-full lg:w-1/2 lg:border-r border-border ${
            activeTab === "edit" ? "block" : "hidden lg:block"
          }`}
        >
          <div className="max-w-xl mx-auto space-y-4">
            <BasicsForm basics={state.content.basics} updateContent={updateContent} />
            <SummaryForm summary={state.content.summary} updateContent={updateContent} />
            <EducationForm education={state.content.education || []} updateContent={updateContent} />
            <SkillsForm skills={state.content.skills || []} updateContent={updateContent} />
            <ExperienceForm experience={state.content.experience || []} updateContent={updateContent} />
            <ProjectsForm projects={state.content.projects || []} updateContent={updateContent} />
            <CertificationsForm certifications={state.content.certifications || []} updateContent={updateContent} />
          </div>
        </div>

        <div
          id="panel-preview"
          role="tabpanel"
          aria-labelledby="tab-preview"
          className={`h-full overflow-hidden w-full lg:w-1/2 ${
            activeTab === "preview" ? "block" : "hidden lg:block"
          }`}
        >
          <PreviewPane content={state.content} resumeTitle={state.title} />
        </div>
      </main>
    </div>
  );
};
