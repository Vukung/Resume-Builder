import { useReducer, useEffect, useRef, useCallback } from "react";
import { ResumeContent } from "../../api/types";
import { api } from "../../api/client";
import { toSaveable } from "../utils/sanitizer";

export type SaveStatus = "saved" | "dirty" | "saving" | "error";
export type LoadStatus = "loading" | "loaded" | "notFound" | "error";

interface EditorState {
  id: string;
  title: string;
  content: ResumeContent | null;
  lastSavedContent: ResumeContent | null;
  loadStatus: LoadStatus;
  saveState: SaveStatus;
  retryCount: number;
  errorMessage: string | null;
}

type EditorAction =
  | { type: "LOAD_SUCCESS"; title: string; content: ResumeContent }
  | { type: "LOAD_ERROR"; status: "notFound" | "error"; message?: string }
  | { type: "UPDATE_CONTENT"; updater: (prev: ResumeContent) => ResumeContent }
  | { type: "SET_TITLE"; title: string }
  | { type: "SAVE_START" }
  | { type: "SAVE_SUCCESS"; savedContent: ResumeContent }
  | { type: "SAVE_ERROR"; error: string; retryCount: number };

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "LOAD_SUCCESS":
      return {
        ...state,
        title: action.title,
        content: action.content,
        lastSavedContent: action.content,
        loadStatus: "loaded",
        saveState: "saved",
        retryCount: 0,
      };
    case "LOAD_ERROR":
      return {
        ...state,
        loadStatus: action.status,
        errorMessage: action.message || null,
      };
    case "UPDATE_CONTENT": {
      if (!state.content) return state;
      const nextContent = action.updater(state.content);
      return {
        ...state,
        content: nextContent,
        saveState: "dirty",
        retryCount: 0,
      };
    }
    case "SET_TITLE":
      return { ...state, title: action.title };
    case "SAVE_START":
      return { ...state, saveState: "saving" };
    case "SAVE_SUCCESS": {
      const isStillDirty =
        JSON.stringify(state.content) !== JSON.stringify(action.savedContent);
      return {
        ...state,
        lastSavedContent: action.savedContent,
        saveState: isStillDirty ? "dirty" : "saved",
        retryCount: 0,
        errorMessage: null,
      };
    }
    case "SAVE_ERROR":
      return {
        ...state,
        saveState: "error",
        retryCount: action.retryCount,
        errorMessage: action.error,
      };
    default:
      return state;
  }
}

export function useEditorState(resumeId: string) {
  const [state, dispatch] = useReducer(editorReducer, {
    id: resumeId,
    title: "",
    content: null,
    lastSavedContent: null,
    loadStatus: "loading",
    saveState: "saved",
    retryCount: 0,
    errorMessage: null,
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const inFlightRef = useRef(false);
  const pendingSaveRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | number | null>(null);
  const retryTimerRef = useRef<NodeJS.Timeout | number | null>(null);

  // Initial load
  useEffect(() => {
    let isMounted = true;
    api
      .getResume(resumeId)
      .then((res) => {
        if (isMounted) {
          dispatch({
            type: "LOAD_SUCCESS",
            title: res.resume.title,
            content: res.resume.content,
          });
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const status = (err as { status?: number })?.status;
        if (status === 404) {
          dispatch({ type: "LOAD_ERROR", status: "notFound" });
        } else {
          dispatch({
            type: "LOAD_ERROR",
            status: "error",
            message: (err as Error)?.message || "Failed to load",
          });
        }
      });

    return () => {
      isMounted = false;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [resumeId]);

  const doSave = useCallback(async (): Promise<boolean> => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);

    const current = stateRef.current;
    if (!current.content) return true;

    if (inFlightRef.current) {
      pendingSaveRef.current = true;
      return false;
    }

    if (
      current.lastSavedContent &&
      JSON.stringify(current.content) === JSON.stringify(current.lastSavedContent)
    ) {
      dispatch({ type: "SAVE_SUCCESS", savedContent: current.content });
      return true;
    }

    inFlightRef.current = true;
    pendingSaveRef.current = false;
    dispatch({ type: "SAVE_START" });

    const contentToSave = current.content;
    const payload = toSaveable(contentToSave);

    try {
      await api.saveContent(current.id, payload);
      inFlightRef.current = false;
      dispatch({ type: "SAVE_SUCCESS", savedContent: contentToSave });

      if (pendingSaveRef.current) {
        pendingSaveRef.current = false;
        return doSave();
      }
      return true;
    } catch (err: unknown) {
      inFlightRef.current = false;
      const nextRetry = stateRef.current.retryCount + 1;
      const message = (err as Error)?.message || "Failed to save";
      dispatch({ type: "SAVE_ERROR", error: message, retryCount: nextRetry });

      if (nextRetry <= 3) {
        retryTimerRef.current = setTimeout(() => {
          doSave();
        }, 5000);
      }
      return false;
    }
  }, []);

  const updateContent = useCallback(
    (updater: (prev: ResumeContent) => ResumeContent) => {
      dispatch({ type: "UPDATE_CONTENT", updater });
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);

      if (inFlightRef.current) {
        pendingSaveRef.current = true;
      } else {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
          doSave();
        }, 1500);
      }
    },
    [doSave]
  );

  const flush = useCallback(async (): Promise<boolean> => {
    return doSave();
  }, [doSave]);

  const renameTitle = useCallback(
    async (newTitle: string) => {
      const trimmed = newTitle.trim();
      if (!trimmed || trimmed === stateRef.current.title) return;
      const res = await api.renameResume(resumeId, trimmed);
      dispatch({ type: "SET_TITLE", title: res.resume.title });
    },
    [resumeId]
  );

  // Keyboard shortcut Ctrl+S / Cmd+S & page visibility change flush
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        flush();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flush();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [flush]);

  // Warning on beforeunload when dirty, saving or error
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.saveState !== "saved") {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [state.saveState]);

  return {
    state,
    updateContent,
    flush,
    retryNow: doSave,
    renameTitle,
  };
}
