import { ReactNode, useRef } from "react";
import { ArrowUp, ArrowDown, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

interface RepeatableListProps<T extends { id: string }> {
  items: T[];
  onItemsChange: (items: T[]) => void;
  createItem: () => T;
  getItemLabel: (item: T, index: number) => string;
  renderItem: (item: T, index: number, updateItem: (updated: T) => void) => ReactNode;
  limit: number;
  addLabel: string;
}

export function RepeatableList<T extends { id: string }>({
  items,
  onItemsChange,
  createItem,
  getItemLabel,
  renderItem,
  limit,
  addLabel,
}: RepeatableListProps<T>) {
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const next = [...items];
    const temp = next[index];
    next[index] = next[index - 1];
    next[index - 1] = temp;
    onItemsChange(next);
  };

  const handleMoveDown = (index: number) => {
    if (index >= items.length - 1) return;
    const next = [...items];
    const temp = next[index];
    next[index] = next[index + 1];
    next[index + 1] = temp;
    onItemsChange(next);
  };

  const handleRemove = (index: number) => {
    const removedItem = items[index];
    const next = items.filter((_, i) => i !== index);
    onItemsChange(next);

    toast("Removed.", {
      action: {
        label: "Undo",
        onClick: () => {
          const current = itemsRef.current;
          const targetIndex = Math.min(index, current.length);
          const restored = [
            ...current.slice(0, targetIndex),
            removedItem,
            ...current.slice(targetIndex),
          ];
          onItemsChange(restored);
        },
      },
      duration: 6000,
    });
  };

  const handleAdd = () => {
    if (items.length >= limit) return;
    const newItem = createItem();
    onItemsChange([...items, newItem]);
  };

  const handleUpdate = (index: number, updated: T) => {
    const current = itemsRef.current;
    const next = [...current];
    next[index] = updated;
    itemsRef.current = next;
    onItemsChange(next);
  };

  const isLimitReached = items.length >= limit;

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-border rounded-lg bg-surface/50">
          <p className="text-sm text-foreground-muted mb-3">No entries yet</p>
          <button
            type="button"
            onClick={handleAdd}
            disabled={isLimitReached}
            title={isLimitReached ? `Limit of ${limit} reached` : undefined}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-accent text-white rounded hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{addLabel}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => {
            const label = getItemLabel(item, index);
            return (
              <div
                key={item.id}
                className="border border-border rounded-lg bg-surface p-4 space-y-4 shadow-2xs"
              >
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <span className="text-sm font-bold text-foreground truncate max-w-[200px] sm:max-w-xs">
                    {label}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      aria-label={`Move up ${label}`}
                      title="Move up"
                      className="p-1 text-foreground-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-surface-card focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === items.length - 1}
                      aria-label={`Move down ${label}`}
                      title="Move down"
                      className="p-1 text-foreground-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-surface-card focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(index)}
                      aria-label={`Remove ${label}`}
                      title="Remove"
                      className="p-1 text-foreground-muted hover:text-destructive rounded hover:bg-destructive-subtle focus:outline-none focus:ring-1 focus:ring-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {renderItem(item, index, (updated) => handleUpdate(index, updated))}
              </div>
            );
          })}

          <div className="pt-1">
            <button
              type="button"
              onClick={handleAdd}
              disabled={isLimitReached}
              title={isLimitReached ? `Limit of ${limit} reached` : undefined}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-accent text-white rounded hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{addLabel}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
