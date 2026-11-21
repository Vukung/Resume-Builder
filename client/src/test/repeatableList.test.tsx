import { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RepeatableList } from "../editor/components/RepeatableList";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: vi.fn(),
}));

interface TestItem {
  id: string;
  name: string;
}

const Wrapper = ({
  initialItems = [
    { id: "1", name: "Item 1" },
    { id: "2", name: "Item 2" },
    { id: "3", name: "Item 3" },
  ],
  limit = 5,
}: {
  initialItems?: TestItem[];
  limit?: number;
}) => {
  const [items, setItems] = useState<TestItem[]>(initialItems);

  return (
    <div>
      <RepeatableList
        items={items}
        onItemsChange={setItems}
        limit={limit}
        addLabel="Add item"
        createItem={() => ({ id: `new-${Date.now()}`, name: "" })}
        getItemLabel={(item) => item.name || "Untitled"}
        renderItem={(item) => <div data-testid={`content-${item.id}`}>{item.name}</div>}
      />
      <div data-testid="preview-order">
        {items.map((it) => it.name).join(", ")}
      </div>
    </div>
  );
};

describe("RepeatableList", () => {
  it("disables Move up on first item and Move down on last item, and reorders items correctly", async () => {
    const user = userEvent.setup();
    render(<Wrapper />);

    const moveUpButtons = screen.getAllByTitle("Move up");
    const moveDownButtons = screen.getAllByTitle("Move down");

    // Move up disabled on first
    expect(moveUpButtons[0]).toBeDisabled();
    expect(moveUpButtons[1]).not.toBeDisabled();

    // Move down disabled on last
    expect(moveDownButtons[2]).toBeDisabled();
    expect(moveDownButtons[0]).not.toBeDisabled();

    expect(screen.getByTestId("preview-order")).toHaveTextContent("Item 1, Item 2, Item 3");

    // Click Move down on Item 1
    await user.click(moveDownButtons[0]);
    expect(screen.getByTestId("preview-order")).toHaveTextContent("Item 2, Item 1, Item 3");

    // Click Move up on Item 3
    const updatedMoveUp = screen.getAllByTitle("Move up");
    await user.click(updatedMoveUp[2]);
    expect(screen.getByTestId("preview-order")).toHaveTextContent("Item 2, Item 3, Item 1");
  });

  it("shows Undo toast when removing an entry and restores the entry at its original index", async () => {
    const user = userEvent.setup();
    render(<Wrapper />);

    const removeButtons = screen.getAllByTitle("Remove");
    // Remove Item 2 (index 1)
    await user.click(removeButtons[1]);

    expect(screen.getByTestId("preview-order")).toHaveTextContent("Item 1, Item 3");
    expect(toast).toHaveBeenCalledWith(
      "Removed.",
      expect.objectContaining({
        duration: 6000,
        action: expect.objectContaining({ label: "Undo" }),
      })
    );

    // Call the undo action callback wrapped in act
    const toastCall = vi.mocked(toast).mock.calls[0];
    const toastOptions = toastCall[1] as { action?: { onClick?: () => void } };
    await act(async () => {
      toastOptions?.action?.onClick?.();
    });

    // Item 2 is restored at index 1
    expect(screen.getByTestId("preview-order")).toHaveTextContent("Item 1, Item 2, Item 3");
  });

  it("disables Add button when limit is reached", async () => {
    const items = Array.from({ length: 3 }, (_, i) => ({
      id: `id-${i}`,
      name: `Item ${i + 1}`,
    }));
    render(<Wrapper initialItems={items} limit={3} />);

    const addBtn = screen.getByRole("button", { name: /add item/i });
    expect(addBtn).toBeDisabled();
    expect(addBtn).toHaveAttribute("title", "Limit of 3 reached");
  });
});
