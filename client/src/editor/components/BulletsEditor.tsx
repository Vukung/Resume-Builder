import React, { useRef, useEffect, ReactNode, KeyboardEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { LIMITS } from "../limits";

interface BulletsEditorProps {
  bullets: string[];
  onChange: (bullets: string[]) => void;
  help?: ReactNode;
  label?: string;
}

export const BulletsEditor: React.FC<BulletsEditorProps> = ({
  bullets,
  onChange,
  help,
  label = "Bullet Points",
}) => {
  const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const pendingFocusIndex = useRef<number | null>(null);

  useEffect(() => {
    if (pendingFocusIndex.current !== null) {
      const idx = pendingFocusIndex.current;
      pendingFocusIndex.current = null;
      if (textareaRefs.current[idx]) {
        textareaRefs.current[idx]?.focus();
      }
    }
  }, [bullets]);

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>, index: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (bullets.length < LIMITS.MAX_BULLETS) {
        const next = [...bullets];
        next.splice(index + 1, 0, "");
        pendingFocusIndex.current = index + 1;
        onChange(next);
      }
    } else if (e.key === "Backspace" && bullets[index] === "" && bullets.length > 0) {
      e.preventDefault();
      const next = bullets.filter((_, i) => i !== index);
      pendingFocusIndex.current = Math.max(0, index - 1);
      onChange(next);
    }
  };

  const handleBulletChange = (val: string, index: number) => {
    const next = [...bullets];
    next[index] = val;
    onChange(next);
  };

  const handleAdd = () => {
    if (bullets.length >= LIMITS.MAX_BULLETS) return;
    pendingFocusIndex.current = bullets.length;
    onChange([...bullets, ""]);
  };

  const handleRemove = (index: number) => {
    onChange(bullets.filter((_, i) => i !== index));
  };

  const isLimitReached = bullets.length >= LIMITS.MAX_BULLETS;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <label className="block text-xs font-semibold text-foreground">{label}</label>
          {help}
        </div>
        <span className="text-2xs text-foreground-muted">
          {bullets.length}/{LIMITS.MAX_BULLETS}
        </span>
      </div>

      <div className="space-y-2">
        {bullets.map((bullet, index) => (
          <div key={index} className="flex items-start gap-2">
            <span className="text-foreground-muted text-sm pt-2 select-none">•</span>
            <div className="flex-1 relative">
              <textarea
                ref={(el) => {
                  textareaRefs.current[index] = el;
                  if (el) autoResize(el);
                }}
                rows={1}
                value={bullet}
                maxLength={LIMITS.BULLET_MAX_LENGTH}
                placeholder="Describe an accomplishment or responsibility..."
                onChange={(e) => {
                  autoResize(e.target);
                  handleBulletChange(e.target.value, index);
                }}
                onKeyDown={(e) => handleKeyDown(e, index)}
                aria-label={`Bullet point ${index + 1}`}
                className="w-full text-sm bg-surface-card border border-border rounded-md px-3 py-1.5 text-foreground placeholder:text-foreground-subtle focus:outline-none focus:ring-2 focus:ring-accent resize-none overflow-hidden"
              />
              {bullet.length > 400 && (
                <span className="absolute bottom-1 right-2 text-2xs text-foreground-muted bg-surface-card px-1 rounded">
                  {bullet.length}/{LIMITS.BULLET_MAX_LENGTH}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleRemove(index)}
              aria-label={`Remove bullet ${index + 1}`}
              className="p-1.5 text-foreground-muted hover:text-destructive rounded hover:bg-destructive-subtle focus:outline-none focus:ring-1 focus:ring-destructive shrink-0 mt-0.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={handleAdd}
          disabled={isLimitReached}
          title={isLimitReached ? `Limit of ${LIMITS.MAX_BULLETS} reached` : undefined}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-accent hover:text-accent-hover disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-accent rounded"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add bullet</span>
        </button>
      </div>
    </div>
  );
};
