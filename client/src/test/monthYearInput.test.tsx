import { useState } from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MonthYearInput } from "../editor/components/MonthYearInput";

const MonthYearWrapper = ({ initialValue = "" }: { initialValue?: string }) => {
  const [val, setVal] = useState(initialValue);
  return (
    <div>
      <MonthYearInput label="Start date" value={val} onChange={setVal} />
      <span data-testid="emitted-value">{val}</span>
    </div>
  );
};

describe("MonthYearInput", () => {
  it("emits empty string and shows hint when choosing only month, then emits YYYY-MM when both chosen", async () => {
    const user = userEvent.setup();
    render(<MonthYearWrapper />);

    const monthSelect = screen.getByLabelText("Start date month");
    const yearSelect = screen.getByLabelText("Start date year");

    // Initially empty
    expect(screen.getByTestId("emitted-value")).toHaveTextContent("");
    expect(screen.queryByText("Choose both month and year")).not.toBeInTheDocument();

    // Select month only
    await user.selectOptions(monthSelect, "08");
    expect(screen.getByTestId("emitted-value")).toHaveTextContent("");
    expect(screen.getByText("Choose both month and year")).toBeInTheDocument();

    // Select year
    await user.selectOptions(yearSelect, "2022");
    expect(screen.getByTestId("emitted-value")).toHaveTextContent("2022-08");
    expect(screen.queryByText("Choose both month and year")).not.toBeInTheDocument();
  });
});
