import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DashboardPage } from "../pages/DashboardPage";
import { api } from "../api/client";
import * as UseAuthModule from "../context/useAuth";

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(UseAuthModule, "useAuth").mockReturnValue({
      user: { id: "u-1", name: "Jordan Smith", email: "jordan@example.com", isDemo: false },
      isLoading: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      setUser: vi.fn(),
      startDemo: vi.fn(),
    });
  });

  it("shows the empty state when the list is empty", async () => {
    vi.spyOn(api, "listResumes").mockResolvedValue({ resumes: [] });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("No resumes yet")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /create resume/i })).toBeInTheDocument();
  });

  it("shows card titles when the list is not empty", async () => {
    vi.spyOn(api, "listResumes").mockResolvedValue({
      resumes: [
        {
          id: "res-1",
          title: "Fullstack Developer Resume",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "res-2",
          title: "Product Manager Resume",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Fullstack Developer Resume")).toBeInTheDocument();
      expect(screen.getByText("Product Manager Resume")).toBeInTheDocument();
    });
    expect(screen.queryByText("No resumes yet")).not.toBeInTheDocument();
  });
});
