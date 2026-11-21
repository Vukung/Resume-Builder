import { useState } from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BulletsEditor } from "../editor/components/BulletsEditor";

const BulletsWrapper = ({ initialBullets = ["First bullet"] }: { initialBullets?: string[] }) => {
  const [bullets, setBullets] = useState<string[]>(initialBullets);

  return (
    <div>
      <BulletsEditor bullets={bullets} onChange={setBullets} />
      <div data-testid="bullets-count">{bullets.length}</div>
    </div>
  );
};

describe("BulletsEditor", () => {
  it("inserts a bullet below on Enter and focuses it, and removes on Backspace and focuses previous", async () => {
    const user = userEvent.setup();
    render(<BulletsWrapper />);

    const firstBullet = screen.getByLabelText("Bullet point 1");
    expect(firstBullet).toHaveValue("First bullet");

    // Press Enter inside bullet 1
    await user.type(firstBullet, "{Enter}");

    expect(screen.getByTestId("bullets-count")).toHaveTextContent("2");
    const secondBullet = screen.getByLabelText("Bullet point 2");
    expect(secondBullet).toHaveFocus();
    expect(secondBullet).toHaveValue("");

    // Press Backspace in empty bullet 2 -> removes bullet 2 and focuses bullet 1
    await user.type(secondBullet, "{Backspace}");
    expect(screen.getByTestId("bullets-count")).toHaveTextContent("1");
    expect(screen.getByLabelText("Bullet point 1")).toHaveFocus();
  });

  it("disables Add bullet button when limit of 15 is reached", () => {
    const fifteenBullets = Array.from({ length: 15 }, (_, i) => `Bullet ${i + 1}`);
    render(<BulletsWrapper initialBullets={fifteenBullets} />);

    const addBtn = screen.getByRole("button", { name: /add bullet/i });
    expect(addBtn).toBeDisabled();
    expect(addBtn).toHaveAttribute("title", "Limit of 15 reached");
  });
});
