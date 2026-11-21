import { useState } from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TagInput } from "../editor/components/TagInput";

const TagWrapper = ({
  maxCount = 5,
  maxTagLength = 10,
}: {
  maxCount?: number;
  maxTagLength?: number;
}) => {
  const [tags, setTags] = useState<string[]>([]);

  return (
    <div>
      <TagInput
        label="Skills"
        tags={tags}
        onChange={setTags}
        maxCount={maxCount}
        maxTagLength={maxTagLength}
      />
      <div data-testid="chips-list">{tags.join(";")}</div>
    </div>
  );
};

describe("TagInput", () => {
  it("adds with Enter, comma, and ignores case-insensitive duplicates", async () => {
    const user = userEvent.setup();
    render(<TagWrapper />);

    const input = screen.getByLabelText("Skills");

    // Enter adds
    await user.type(input, "React{Enter}");
    expect(screen.getByTestId("chips-list")).toHaveTextContent("React");

    // Comma adds
    await user.type(input, "TypeScript,");
    expect(screen.getByTestId("chips-list")).toHaveTextContent("React;TypeScript");

    // Case-insensitive duplicate is ignored
    await user.type(input, "react{Enter}");
    expect(screen.getByTestId("chips-list")).toHaveTextContent("React;TypeScript");
  });

  it("adds multiple chips when pasting comma-separated values", async () => {
    render(<TagWrapper />);
    const input = screen.getByLabelText("Skills");

    fireEvent.paste(input, {
      clipboardData: {
        getData: () => "HTML, CSS, JavaScript",
      },
    });

    expect(screen.getByTestId("chips-list")).toHaveTextContent("HTML;CSS;JavaScript");
  });

  it("removes the last chip on Backspace when input is empty", async () => {
    const user = userEvent.setup();
    render(<TagWrapper />);
    const input = screen.getByLabelText("Skills");

    await user.type(input, "Alpha{Enter}Beta{Enter}");
    expect(screen.getByTestId("chips-list")).toHaveTextContent("Alpha;Beta");

    // Backspace with empty input removes Beta
    await user.type(input, "{Backspace}");
    expect(screen.getByTestId("chips-list")).toHaveTextContent("Alpha");
  });

  it("enforces max tag length and max count", async () => {
    const user = userEvent.setup();
    render(<TagWrapper maxCount={2} maxTagLength={5} />);
    const input = screen.getByLabelText("Skills");

    // Enforce max length: typing 10 characters truncates to 5
    await user.type(input, "1234567890{Enter}");
    expect(screen.getByTestId("chips-list")).toHaveTextContent("12345");

    // Add second tag to reach max count 2
    await user.type(input, "ABC{Enter}");
    expect(screen.getByTestId("chips-list")).toHaveTextContent("12345;ABC");

    // Input should now be disabled
    expect(input).toBeDisabled();
  });
});
