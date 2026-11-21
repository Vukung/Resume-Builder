import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { EditorPage } from "../pages/EditorPage";
import { api } from "../api/client";
import { ResumeContent } from "../api/types";

function createEducationResume(gradeType: "percentage" | "cgpa", gradeValue: number | null): ResumeContent {
  return {
    schemaVersion: 1,
    basics: { fullName: "Rahul Verma", email: "rahul@example.com", phone: "", location: "", links: [] },
    summary: "",
    education: [
      {
        id: "edu-mit",
        institution: "MIT Academy Of Engineering",
        degree: "B.Tech in Electronics and Telecommunication",
        startDate: "2022-11",
        endDate: "2026-06",
        gradeType,
        gradeValue,
      },
    ],
    experience: [],
    projects: [],
    certifications: [],
    skills: [],
  };
}

describe("Grade Type Switch & Hint (Part 2)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("switches grade type from percentage to cgpa for existing entry with 8.98, updates preview and autosaves", async () => {
    const user = userEvent.setup();
    const saveSpy = vi.spyOn(api, "saveContent").mockResolvedValue({ updatedAt: new Date().toISOString() });
    vi.spyOn(api, "getResume").mockResolvedValue({
      resume: { id: "res-1", title: "Engineering", content: createEducationResume("percentage", 8.98), createdAt: "", updatedAt: "" },
    });

    render(<MemoryRouter initialEntries={["/resume/res-1"]}><Routes><Route path="/resume/:id" element={<EditorPage />} /></Routes></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole("heading", { level: 1, name: "Engineering" })).toBeInTheDocument());

    const editPanel = screen.getByRole("tabpanel", { name: /edit/i });
    const previewPanel = screen.getByRole("tabpanel", { name: /preview/i });
    expect(within(previewPanel).getByText(/Percentage: 8.98%/)).toBeInTheDocument();

    const expandBtn = editPanel.querySelector("button[aria-expanded='false']") as HTMLButtonElement;
    await user.click(expandBtn);

    const gradeTypeSelect = within(editPanel).getByRole("combobox", { name: /grade type/i });
    expect(gradeTypeSelect).toHaveValue("percentage");

    await user.selectOptions(gradeTypeSelect, "cgpa");
    expect(gradeTypeSelect).toHaveValue("cgpa");
    expect(within(previewPanel).getByText(/CGPA: 8.98\/10/)).toBeInTheDocument();

    await waitFor(() => {
      expect(saveSpy).toHaveBeenCalledWith(
        "res-1",
        expect.objectContaining({
          education: [expect.objectContaining({ gradeType: "cgpa", gradeValue: 8.98 })],
        })
      );
    }, { timeout: 3000 });
  });

  it("handles reverse switch from CGPA back to Percentage", async () => {
    const user = userEvent.setup();
    const saveSpy = vi.spyOn(api, "saveContent").mockResolvedValue({ updatedAt: new Date().toISOString() });
    vi.spyOn(api, "getResume").mockResolvedValue({
      resume: { id: "res-2", title: "Reverse Test", content: createEducationResume("cgpa", 8.98), createdAt: "", updatedAt: "" },
    });

    render(<MemoryRouter initialEntries={["/resume/res-2"]}><Routes><Route path="/resume/:id" element={<EditorPage />} /></Routes></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole("heading", { level: 1, name: "Reverse Test" })).toBeInTheDocument());

    const editPanel = screen.getByRole("tabpanel", { name: /edit/i });
    const previewPanel = screen.getByRole("tabpanel", { name: /preview/i });
    await user.click(editPanel.querySelector("button[aria-expanded='false']") as HTMLButtonElement);

    const select = within(editPanel).getByRole("combobox", { name: /grade type/i });
    expect(select).toHaveValue("cgpa");

    await user.selectOptions(select, "percentage");
    expect(select).toHaveValue("percentage");
    expect(within(previewPanel).getByText(/Percentage: 8.98%/)).toBeInTheDocument();

    await waitFor(() => {
      expect(saveSpy).toHaveBeenCalledWith("res-2", expect.objectContaining({
        education: [expect.objectContaining({ gradeType: "percentage", gradeValue: 8.98 })],
      }));
    }, { timeout: 3000 });
  });

  it("switches grade type when gradeValue is null", async () => {
    const user = userEvent.setup();
    const saveSpy = vi.spyOn(api, "saveContent").mockResolvedValue({ updatedAt: new Date().toISOString() });
    vi.spyOn(api, "getResume").mockResolvedValue({
      resume: { id: "res-3", title: "Null Grade", content: createEducationResume("percentage", null), createdAt: "", updatedAt: "" },
    });

    render(<MemoryRouter initialEntries={["/resume/res-3"]}><Routes><Route path="/resume/:id" element={<EditorPage />} /></Routes></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole("heading", { level: 1, name: "Null Grade" })).toBeInTheDocument());

    const editPanel = screen.getByRole("tabpanel", { name: /edit/i });
    await user.click(editPanel.querySelector("button[aria-expanded='false']") as HTMLButtonElement);

    const select = within(editPanel).getByRole("combobox", { name: /grade type/i });
    expect(select).toHaveValue("percentage");

    await user.selectOptions(select, "cgpa");
    expect(select).toHaveValue("cgpa");

    await waitFor(() => {
      expect(saveSpy).toHaveBeenCalledWith("res-3", expect.objectContaining({
        education: [expect.objectContaining({ gradeType: "cgpa", gradeValue: null })],
      }));
    }, { timeout: 3000 });
  });

  it("switches when value is out of range for new type (85 changed to CGPA): select changes, shows error, toSaveable sends null", async () => {
    const user = userEvent.setup();
    const saveSpy = vi.spyOn(api, "saveContent").mockResolvedValue({ updatedAt: new Date().toISOString() });
    vi.spyOn(api, "getResume").mockResolvedValue({
      resume: { id: "res-4", title: "Out Of Range", content: createEducationResume("percentage", 85), createdAt: "", updatedAt: "" },
    });

    render(<MemoryRouter initialEntries={["/resume/res-4"]}><Routes><Route path="/resume/:id" element={<EditorPage />} /></Routes></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole("heading", { level: 1, name: "Out Of Range" })).toBeInTheDocument());

    const editPanel = screen.getByRole("tabpanel", { name: /edit/i });
    await user.click(editPanel.querySelector("button[aria-expanded='false']") as HTMLButtonElement);

    const select = within(editPanel).getByRole("combobox", { name: /grade type/i });
    await user.selectOptions(select, "cgpa");

    // Select must still change to cgpa
    expect(select).toHaveValue("cgpa");

    // Inline error appears
    expect(within(editPanel).getByText("Enter a number between 0 and 10")).toBeInTheDocument();
    expect(within(editPanel).getByText("Not saved until valid")).toBeInTheDocument();

    // toSaveable sends null for gradeValue while saving gradeType: "cgpa"
    await waitFor(() => {
      expect(saveSpy).toHaveBeenCalledWith("res-4", expect.objectContaining({
        education: [expect.objectContaining({ gradeType: "cgpa", gradeValue: null })],
      }));
    }, { timeout: 3000 });
  });

  it("soft hint appears at 8.98 with Percentage, disappears when switched to CGPA, and does not appear at 85", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "getResume").mockResolvedValue({
      resume: { id: "res-5", title: "Hint Test", content: createEducationResume("percentage", 8.98), createdAt: "", updatedAt: "" },
    });

    const { unmount } = render(<MemoryRouter initialEntries={["/resume/res-5"]}><Routes><Route path="/resume/:id" element={<EditorPage />} /></Routes></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole("heading", { level: 1, name: "Hint Test" })).toBeInTheDocument());

    const editPanel = screen.getByRole("tabpanel", { name: /edit/i });
    await user.click(editPanel.querySelector("button[aria-expanded='false']") as HTMLButtonElement);

    const hintText = "That looks like a CGPA. Switch the grade type to CGPA if it is out of 10.";

    // 1. Appears at 8.98 with Percentage
    expect(within(editPanel).getByText(hintText)).toBeInTheDocument();

    // 2. Disappears when switched to CGPA
    const select = within(editPanel).getByRole("combobox", { name: /grade type/i });
    await user.selectOptions(select, "cgpa");
    expect(within(editPanel).queryByText(hintText)).not.toBeInTheDocument();

    unmount();

    // 3. Does not appear at 85 with Percentage
    vi.spyOn(api, "getResume").mockResolvedValue({
      resume: { id: "res-6", title: "85 Test", content: createEducationResume("percentage", 85), createdAt: "", updatedAt: "" },
    });
    render(<MemoryRouter initialEntries={["/resume/res-6"]}><Routes><Route path="/resume/:id" element={<EditorPage />} /></Routes></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole("heading", { level: 1, name: "85 Test" })).toBeInTheDocument());

    const editPanel2 = screen.getByRole("tabpanel", { name: /edit/i });
    await user.click(editPanel2.querySelector("button[aria-expanded='false']") as HTMLButtonElement);
    expect(within(editPanel2).queryByText(hintText)).not.toBeInTheDocument();
  });
});
