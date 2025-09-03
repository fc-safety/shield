import { Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ViewContext } from "~/.server/api-utils";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import { cn } from "~/lib/utils";
import { Textarea } from "./ui/textarea";

interface SubmittingTextareaProps {
  value: string;
  onValueChange?: (value: string) => void;
  path: string;
  valueKey: string | ((value: string) => any);
  className?: string;
  placeholder?: string;
  isEditing: boolean;
  onEditingChange: (editing: boolean) => void;
  displayClassName?: string;
  viewContext?: ViewContext;
}

export default function SubmittingTextarea({
  value,
  onValueChange,
  path,
  valueKey,
  className,
  placeholder,
  isEditing,
  onEditingChange,
  displayClassName,
  viewContext,
}: SubmittingTextareaProps) {
  const [currentValue, setCurrentValue] = useState(() => value);
  const { submitJson: updateValue, isLoading } = useModalFetcher();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea to match content and position cursor at end
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const textarea = textareaRef.current;

      // Set height based on scroll height
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";

      // Focus and position cursor at the end
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    }
  }, [isEditing]);

  const handleSave = () => {
    if (currentValue !== value) {
      onValueChange?.(currentValue);
      updateValue(
        typeof valueKey === "function" ? valueKey(currentValue) : { [valueKey]: currentValue },
        {
          method: "patch",
          path,
          viewContext,
        }
      );
    }
    onEditingChange(false);
  };

  const handleCancel = () => {
    setCurrentValue(value);
    onEditingChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentValue(e.target.value);

    // Auto-resize as user types
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  };

  const handleClickToEdit = () => {
    onEditingChange(true);
  };

  if (isEditing) {
    return (
      <Textarea
        ref={textareaRef}
        value={currentValue}
        onChange={handleTextareaChange}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        className={cn("resize-none overflow-hidden", className)}
        placeholder={placeholder}
        style={{ minHeight: "auto" }}
      />
    );
  }

  return (
    <div className="group relative">
      <span
        className={cn(
          "hover:bg-muted/50 -mx-1 line-clamp-2 cursor-pointer rounded px-1 py-0.5 pr-6",
          displayClassName
        )}
        onClick={() => handleClickToEdit()}
        title="Click to edit"
      >
        {value}
      </span>
      <Pencil className="text-muted-foreground absolute top-1/2 right-0 h-3 w-3 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
}
