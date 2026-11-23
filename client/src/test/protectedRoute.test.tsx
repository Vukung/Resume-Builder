import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";
import * as UseAuthModule from "../context/useAuth";

describe("ProtectedRoute", () => {
  it("redirects a logged out visitor to /login", () => {
    vi.spyOn(UseAuthModule, "useAuth").mockReturnValue({
      user: null,
      isLoading: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      setUser: vi.fn(),
      startDemo: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Protected Dashboard Content</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page Target</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText("Protected Dashboard Content")).not.toBeInTheDocument();
    expect(screen.getByText("Login Page Target")).toBeInTheDocument();
  });

  it("renders its children for a logged in user", () => {
    vi.spyOn(UseAuthModule, "useAuth").mockReturnValue({
      user: { id: "user-123", email: "user@example.com", name: "Alex", isDemo: false },
      isLoading: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      setUser: vi.fn(),
      startDemo: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Protected Dashboard Content</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page Target</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Protected Dashboard Content")).toBeInTheDocument();
    expect(screen.queryByText("Login Page Target")).not.toBeInTheDocument();
  });
});
