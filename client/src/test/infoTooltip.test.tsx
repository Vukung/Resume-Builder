import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InfoTooltip } from "../editor/components/InfoTooltip";

describe("InfoTooltip", () => {
  it("opens on click and on focus and closes on Escape", async () => {
    render(
      <InfoTooltip
        fieldLabel="Full name"
        text="Use the name on your official documents."
        example="Aarav Sharma"
      />
    );

    const button = screen.getByRole("button", {
      name: "More information about Full name",
    });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    // 1. Focus opens tooltip
    await userEvent.tab();
    expect(button).toHaveFocus();
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    expect(screen.getByText("Use the name on your official documents.")).toBeInTheDocument();
    expect(screen.getByText(/Aarav Sharma/)).toBeInTheDocument();

    // 2. Escape closes tooltip
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    // 3. Click toggles tooltip
    await userEvent.click(button);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    await userEvent.click(button);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});
