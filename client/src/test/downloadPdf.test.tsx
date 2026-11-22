import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PreviewToolbar } from "../editor/preview/PreviewToolbar";
import { ResumeContent } from "../api/types";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const populatedContent: ResumeContent = {
  schemaVersion: 1,
  basics: {
    fullName: "Aarav Sharma",
    email: "aarav@example.com",
    phone: "+91 98765 43210",
    location: "Pune, India",
    links: [],
  },
  summary: "Frontend Developer",
  education: [],
  experience: [],
  projects: [],
  certifications: [],
  skills: [],
};

const emptyContent: ResumeContent = {
  schemaVersion: 1,
  basics: { fullName: "", email: "", phone: "", location: "", links: [] },
  summary: "",
  education: [],
  experience: [],
  projects: [],
  certifications: [],
  skills: [],
};

describe("Download PDF flow", () => {
  let mockToBlob: () => Promise<Blob>;
  let pdfCallCount = 0;
  let clickedDownloadAttr = "";
  let clickedHref = "";
  const origClick = HTMLAnchorElement.prototype.click;

  beforeEach(() => {
    vi.clearAllMocks();
    pdfCallCount = 0;
    clickedDownloadAttr = "";
    clickedHref = "";
    mockToBlob = vi.fn().mockResolvedValue(new Blob(["%PDF-mock"], { type: "application/pdf" }));

    HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
      clickedDownloadAttr = this.download;
      clickedHref = this.href;
    };

    vi.doMock("@react-pdf/renderer", () => ({
      pdf: vi.fn(() => {
        pdfCallCount++;
        return {
          toBlob: mockToBlob,
        };
      }),
      Font: {
        registerHyphenationCallback: vi.fn(),
      },
      StyleSheet: {
        create: (s: Record<string, unknown>) => s,
      },
      Document: ({ children }: { children?: React.ReactNode }) => children,
      Page: ({ children }: { children?: React.ReactNode }) => children,
      Text: ({ children }: { children?: React.ReactNode }) => children,
      View: ({ children }: { children?: React.ReactNode }) => children,
      Link: ({ children }: { children?: React.ReactNode }) => children,
    }));

    if (!window.URL.createObjectURL) {
      window.URL.createObjectURL = vi.fn();
    }
    if (!window.URL.revokeObjectURL) {
      window.URL.revokeObjectURL = vi.fn();
    }
    vi.spyOn(window.URL, "createObjectURL").mockReturnValue("blob:http://localhost/mock-pdf-blob");
    vi.spyOn(window.URL, "revokeObjectURL").mockImplementation(() => {});
  });

  afterEach(() => {
    HTMLAnchorElement.prototype.click = origClick;
  });

  it("is disabled with title 'Add some content first' when content is empty", () => {
    render(<PreviewToolbar content={emptyContent} />);
    const btn = screen.getByRole("button", { name: /^download pdf$/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("title", "Add some content first");
  });

  it("downloads with expected filename, sets anchor download, and revokes object URL", async () => {
    const user = userEvent.setup();
    render(<PreviewToolbar content={populatedContent} resumeTitle="Master Resume" />);
    const btn = screen.getByRole("button", { name: /^download pdf$/i });
    expect(btn).not.toBeDisabled();

    await user.click(btn);

    await waitFor(() => {
      expect(mockToBlob).toHaveBeenCalledTimes(1);
    });

    expect(window.URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith("blob:http://localhost/mock-pdf-blob");
    expect(clickedDownloadAttr).toBe("Aarav Sharma - Resume.pdf");
    expect(clickedHref).toBe("blob:http://localhost/mock-pdf-blob");
  });

  it("ignores second click while PDF generation is already in flight", async () => {
    const user = userEvent.setup();
    let resolveBlob: (blob: Blob) => void = () => {};
    mockToBlob = vi.fn().mockImplementation(
      () =>
        new Promise<Blob>((resolve) => {
          resolveBlob = resolve;
        })
    );

    render(<PreviewToolbar content={populatedContent} resumeTitle="Resume" />);
    const btn = screen.getByRole("button", { name: /^download pdf$/i });

    // First click
    await user.click(btn);

    // Button should now show "Preparing PDF..." and aria-busy="true"
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^preparing pdf\.\.\.$/i })).toBeInTheDocument();
    });
    const busyBtn = screen.getByRole("button", { name: /^preparing pdf\.\.\.$/i });
    expect(busyBtn).toBeDisabled();
    expect(busyBtn).toHaveAttribute("aria-busy", "true");

    // Second click during generation
    await user.click(busyBtn);
    expect(pdfCallCount).toBe(1);

    // Resolve the promise
    resolveBlob(new Blob(["%PDF-1.4"], { type: "application/pdf" }));

    // Button should re-enable and show "Download PDF"
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^download pdf$/i })).not.toBeDisabled();
    });
  });

  it("shows toast error and re-enables button when PDF generation fails", async () => {
    const user = userEvent.setup();
    mockToBlob = vi.fn().mockRejectedValue(new Error("Generation failed"));

    render(<PreviewToolbar content={populatedContent} />);
    const btn = screen.getByRole("button", { name: /^download pdf$/i });

    await user.click(btn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Could not create the PDF. Please try again.");
    });

    // Button is re-enabled
    const reenabledBtn = screen.getByRole("button", { name: /^download pdf$/i });
    expect(reenabledBtn).not.toBeDisabled();
    expect(reenabledBtn).toHaveAttribute("aria-busy", "false");
  });
});
