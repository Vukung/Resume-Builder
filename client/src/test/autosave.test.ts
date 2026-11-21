import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useEditorState } from "../editor/hooks/useEditorState";
import { api } from "../api/client";
import { ResumeContent } from "../api/types";

describe("useEditorState Autosave", () => {
  const initialContent: ResumeContent = {
    schemaVersion: 1,
    basics: { fullName: "A", email: "a@example.com", phone: "", location: "", links: [] },
    summary: "Initial summary",
    education: [],
    experience: [],
    projects: [],
    certifications: [],
    skills: [],
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.restoreAllMocks();
    vi.spyOn(api, "getResume").mockResolvedValue({
      resume: {
        id: "res-1",
        title: "Initial Title",
        content: initialContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("autosaves debounced 1500ms after last edit, handles rapid edits, and queues in-flight edits without overlap", async () => {
    let resolveFirstSave: (val: { updatedAt: string }) => void;
    const firstSavePromise = new Promise<{ updatedAt: string }>((resolve) => {
      resolveFirstSave = resolve;
    });

    const saveSpy = vi.spyOn(api, "saveContent").mockImplementationOnce(() => firstSavePromise);

    const { result } = renderHook(() => useEditorState("res-1"));

    // Wait for initial load
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.state.loadStatus).toBe("loaded");
    expect(result.current.state.saveState).toBe("saved");

    // 1. Rapid edits produce exactly one save at 1500ms
    act(() => {
      result.current.updateContent((prev) => ({ ...prev, summary: "Edit 1" }));
    });
    expect(result.current.state.saveState).toBe("dirty");

    // Advance 1000ms (no save yet)
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(saveSpy).not.toHaveBeenCalled();

    // Rapid second edit resets the 1500ms debounce
    act(() => {
      result.current.updateContent((prev) => ({ ...prev, summary: "Edit 2" }));
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(saveSpy).not.toHaveBeenCalled();

    // Advance remaining 500ms -> exactly 1500ms after the second edit
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(saveSpy).toHaveBeenCalledWith("res-1", expect.objectContaining({ summary: "Edit 2" }));
    expect(result.current.state.saveState).toBe("saving");

    // 2. Edit while save is in-flight produces a second save only after the first resolves, with no overlap
    saveSpy.mockResolvedValueOnce({ updatedAt: new Date().toISOString() });

    act(() => {
      result.current.updateContent((prev) => ({ ...prev, summary: "Edit 3" }));
    });
    // In-flight save is still pending, so saveSpy count is still 1
    expect(saveSpy).toHaveBeenCalledTimes(1);

    // Now resolve the first save
    await act(async () => {
      resolveFirstSave!({ updatedAt: new Date().toISOString() });
      await Promise.resolve();
    });

    // The queued save for Edit 3 should now execute
    expect(saveSpy).toHaveBeenCalledTimes(2);
    expect(saveSpy).toHaveBeenLastCalledWith("res-1", expect.objectContaining({ summary: "Edit 3" }));

    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.state.saveState).toBe("saved");
  });

  it("Save failure: handles save failure with error state, 3 retries 5s apart, then stops and allows retryNow", async () => {
    const saveSpy = vi.spyOn(api, "saveContent").mockRejectedValue(new Error("Network disconnect"));

    const { result } = renderHook(() => useEditorState("res-1"));

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.updateContent((prev) => ({ ...prev, summary: "Failed edit" }));
    });

    // Trigger initial save attempt at 1500ms
    await act(async () => {
      vi.advanceTimersByTime(1500);
      await Promise.resolve();
    });
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(result.current.state.saveState).toBe("error");
    expect(result.current.state.retryCount).toBe(1);

    // Retry 1 after 5 seconds
    await act(async () => {
      vi.advanceTimersByTime(5000);
      await Promise.resolve();
    });
    expect(saveSpy).toHaveBeenCalledTimes(2);
    expect(result.current.state.retryCount).toBe(2);

    // Retry 2 after 5 seconds
    await act(async () => {
      vi.advanceTimersByTime(5000);
      await Promise.resolve();
    });
    expect(saveSpy).toHaveBeenCalledTimes(3);
    expect(result.current.state.retryCount).toBe(3);

    // Retry 3 after 5 seconds
    await act(async () => {
      vi.advanceTimersByTime(5000);
      await Promise.resolve();
    });
    expect(saveSpy).toHaveBeenCalledTimes(4);
    expect(result.current.state.retryCount).toBe(4);

    // Advance another 5 seconds: should NOT retry automatically anymore (stopped at 3 retries)
    await act(async () => {
      vi.advanceTimersByTime(5000);
      await Promise.resolve();
    });
    expect(saveSpy).toHaveBeenCalledTimes(4);
    expect(result.current.state.saveState).toBe("error");

    // Manually trigger retryNow()
    saveSpy.mockResolvedValueOnce({ updatedAt: new Date().toISOString() });
    await act(async () => {
      await result.current.retryNow();
    });
    expect(saveSpy).toHaveBeenCalledTimes(5);
    expect(result.current.state.saveState).toBe("saved");
  });
});
