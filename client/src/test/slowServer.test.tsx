import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { SlowServerBanner } from "../components/SlowServerBanner";
import { api } from "../api/client";

describe("SlowServerBanner", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("appears when a request stays pending beyond 4 seconds and disappears when it completes", async () => {
    let resolveRequest: (value: Response) => void;
    const pendingPromise = new Promise<Response>((resolve) => {
      resolveRequest = resolve;
    });

    vi.spyOn(globalThis, "fetch").mockImplementation(() => pendingPromise);

    render(<SlowServerBanner />);

    expect(screen.queryByText(/waking up the server/i)).not.toBeInTheDocument();

    // Start a request
    const requestPromise = api.listResumes();

    // Advance 3.9 seconds - should not appear yet
    act(() => {
      vi.advanceTimersByTime(3900);
    });
    expect(screen.queryByText(/waking up the server/i)).not.toBeInTheDocument();

    // Advance past 4 seconds
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByText(/waking up the server, this can take up to a minute\./i)).toBeInTheDocument();

    // Now resolve the request
    await act(async () => {
      resolveRequest!({
        ok: true,
        json: async () => ({ resumes: [] }),
      } as unknown as Response);
      await requestPromise;
    });

    // Banner should disappear
    expect(screen.queryByText(/waking up the server/i)).not.toBeInTheDocument();
  });
});
