import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React, { useEffect } from "react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { DashboardPage } from "../pages/DashboardPage";
import { EditorPage } from "../pages/EditorPage";
import { api } from "../api/client";
import { AuthProvider } from "../context/AuthContext";
import { useAuth } from "../context/useAuth";
import * as UseAuthModule from "../context/useAuth";
import { toast } from "sonner";
import { User } from "../api/types";

describe("Phase 7b: Demo banner and lifecycle", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("3. banner and Demo badge appear for isDemo user and not for normal user", async () => {
    vi.spyOn(api, "listResumes").mockResolvedValue({ resumes: [] });
    vi.spyOn(api, "getResume").mockResolvedValue({
      resume: {
        id: "res-1",
        title: "Sample Resume",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
        content: {
          schemaVersion: 1,
          basics: { fullName: "Demo", email: "", phone: "", location: "", links: [] },
          summary: "",
          education: [],
          experience: [],
          projects: [],
          certifications: [],
          skills: [],
        },
      },
    });

    const isDemoUser: User = { id: "d-1", email: "demo@test", name: "Demo User", isDemo: true };
    const normalUser: User = { id: "n-1", email: "normal@test", name: "Normal User", isDemo: false };

    const demoContext = {
      user: isDemoUser,
      isLoading: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      setUser: vi.fn(),
      startDemo: vi.fn(),
    };

    vi.spyOn(UseAuthModule, "useAuth").mockReturnValue(demoContext);
    vi.spyOn(UseAuthModule, "useOptionalAuth").mockReturnValue(demoContext);

    const { unmount: unmountDashDemo } = render(
      <MemoryRouter><DashboardPage /></MemoryRouter>
    );
    expect(screen.getByRole("status")).toHaveTextContent(/temporary demo account/i);
    expect(screen.getByText("Demo")).toBeInTheDocument();
    unmountDashDemo();

    const { unmount: unmountEdDemo } = render(
      <MemoryRouter initialEntries={["/resume/res-1"]}>
        <Routes><Route path="/resume/:id" element={<EditorPage />} /></Routes>
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/temporary demo account/i);
    });
    unmountEdDemo();

    const normalContext = {
      user: normalUser,
      isLoading: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      setUser: vi.fn(),
      startDemo: vi.fn(),
    };

    vi.spyOn(UseAuthModule, "useAuth").mockReturnValue(normalContext);
    vi.spyOn(UseAuthModule, "useOptionalAuth").mockReturnValue(normalContext);

    const { unmount: unmountDashNorm } = render(
      <MemoryRouter><DashboardPage /></MemoryRouter>
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByText("Demo")).not.toBeInTheDocument();
    unmountDashNorm();

    render(
      <MemoryRouter initialEntries={["/resume/res-1"]}>
        <Routes><Route path="/resume/:id" element={<EditorPage />} /></Routes>
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText("Sample Resume")).toBeInTheDocument();
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("4. Create a real account calls logout first and then navigates to /signup", async () => {
    const callOrder: string[] = [];
    const mockLogout = vi.spyOn(api, "logout").mockImplementation(async () => {
      callOrder.push("logout");
      return { ok: true };
    });

    vi.spyOn(api, "listResumes").mockResolvedValue({ resumes: [] });
    vi.spyOn(api, "me").mockResolvedValue({
      user: { id: "demo-1", email: "d@demo", name: "Demo User", isDemo: true },
    });

    const SignupTarget: React.FC = () => {
      useEffect(() => {
        callOrder.push("navigate-signup");
      }, []);
      return <div>Signup Target</div>;
    };

    render(
      <MemoryRouter initialEntries={["/"]}>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/signup" element={<SignupTarget />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: /create a real account/i }));

    await waitFor(() => {
      expect(screen.getByText(/signup target/i)).toBeInTheDocument();
    });

    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(callOrder).toEqual(["logout", "navigate-signup"]);
  });

  it("5. 401 shows demo ended toast for isDemo, and session expired toast for normal user", async () => {
    const toastErrorSpy = vi.spyOn(toast, "error").mockImplementation(() => "" as unknown as string | number);

    vi.spyOn(api, "me").mockResolvedValue({
      user: { id: "d-1", email: "d@demo", name: "Demo", isDemo: true },
    });

    const Consumer: React.FC = () => {
      const { user } = useAuth();
      return <div>User: {user ? (user.isDemo ? "demo" : "normal") : "none"}</div>;
    };

    const { unmount } = render(
      <MemoryRouter initialEntries={["/"]}>
        <AuthProvider><Consumer /></AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("User: demo")).toBeInTheDocument();
    });

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: "Unauthorized" }),
    } as unknown as Response);

    await act(async () => {
      await expect(api.listResumes()).rejects.toThrow();
    });
    expect(toastErrorSpy).toHaveBeenCalledWith(
      "Your demo has ended. Start a new demo or create an account."
    );

    unmount();
    toastErrorSpy.mockClear();

    vi.spyOn(api, "me").mockResolvedValue({
      user: { id: "n-1", email: "n@test", name: "Normal", isDemo: false },
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <AuthProvider><Consumer /></AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("User: normal")).toBeInTheDocument();
    });

    await act(async () => {
      await expect(api.listResumes()).rejects.toThrow();
    });
    expect(toastErrorSpy).toHaveBeenCalledWith(
      "Your session expired. Please log in again."
    );
  });
});
