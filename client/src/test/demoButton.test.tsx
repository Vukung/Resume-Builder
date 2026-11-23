import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { LoginPage } from "../pages/LoginPage";
import { SignupPage } from "../pages/SignupPage";
import { api, ApiError } from "../api/client";
import { AuthProvider } from "../context/AuthContext";
import * as UseAuthModule from "../context/useAuth";
import { User } from "../api/types";

describe("Phase 7b: Try demo button", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("1. calls startDemo once, shows loading, sets user, navigates, and extra clicks do nothing", async () => {
    let resolveDemo: (val: { user: User; resumeId: string }) => void = () => {};
    const demoPromise = new Promise<{ user: User; resumeId: string }>((resolve) => {
      resolveDemo = resolve;
    });

    const mockStartDemo = vi.spyOn(api, "startDemo").mockReturnValue(demoPromise);
    vi.spyOn(api, "me").mockResolvedValue({ user: null as unknown as User });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/resume/:id" element={<div>Resume Editor Target</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    const tryDemoBtn = screen.getByRole("button", { name: /try a demo with a sample resume/i });
    expect(tryDemoBtn).toBeInTheDocument();

    await userEvent.click(tryDemoBtn);

    expect(screen.getByRole("button", { name: /setting up your demo\.\.\./i })).toBeDisabled();

    await userEvent.click(tryDemoBtn);
    expect(mockStartDemo).toHaveBeenCalledTimes(1);

    resolveDemo({
      user: { id: "d-1", email: "demo-1@demo.resume-rocket.invalid", name: "Demo Visitor", isDemo: true },
      resumeId: "sample-resume-id",
    });

    await waitFor(() => {
      expect(screen.getByText("Resume Editor Target")).toBeInTheDocument();
    });
  });

  it("2. 429 and 503 responses show the server's message under button and re-enable it", async () => {
    const mockStartDemo = vi.spyOn(api, "startDemo");
    vi.spyOn(api, "me").mockResolvedValue({ user: null as unknown as User });

    mockStartDemo.mockRejectedValueOnce(
      new ApiError(429, "Too many demo sessions from your network. Please try again later or sign up.")
    );

    const { unmount } = render(
      <MemoryRouter initialEntries={["/login"]}>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await userEvent.click(screen.getByRole("button", { name: /try a demo with a sample resume/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Too many demo sessions from your network. Please try again later or sign up."
      );
    });
    expect(screen.getByRole("button", { name: /try a demo with a sample resume/i })).not.toBeDisabled();
    unmount();

    mockStartDemo.mockRejectedValueOnce(
      new ApiError(503, "The demo is busy right now. Please try again later or sign up.")
    );

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await userEvent.click(screen.getByRole("button", { name: /try a demo with a sample resume/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "The demo is busy right now. Please try again later or sign up."
      );
    });
    expect(screen.getByRole("button", { name: /try a demo with a sample resume/i })).not.toBeDisabled();
  });

  it("6. Try demo button exists on both /login and /signup", () => {
    vi.spyOn(UseAuthModule, "useAuth").mockReturnValue({
      user: null,
      isLoading: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      setUser: vi.fn(),
      startDemo: vi.fn(),
    });

    const { unmount } = render(
      <MemoryRouter><LoginPage /></MemoryRouter>
    );
    expect(screen.getByText("Looking around? No signup needed.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try a demo with a sample resume/i })).toBeInTheDocument();
    unmount();

    render(
      <MemoryRouter><SignupPage /></MemoryRouter>
    );
    expect(screen.getByText("Looking around? No signup needed.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try a demo with a sample resume/i })).toBeInTheDocument();
  });
});
