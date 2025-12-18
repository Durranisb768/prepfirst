import { useState, useRef, useEffect, type KeyboardEvent, type FocusEvent } from "react";
import { useEditMode } from "@/contexts/EditModeContext";
import { Pencil, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface EditableTextProps {
  value: string;
  settingKey?: string;
  entityType?: "subject" | "topic" | "material" | "site_setting";
  entityId?: number;
  field?: string;
  onSave?: (newValue: string) => void;
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";
  placeholder?: string;
}

export function EditableText({
  value,
  settingKey,
  entityType,
  entityId,
  field = "name",
  onSave,
  className,
  as: Component = "span",
  placeholder = "Click to edit...",
}: EditableTextProps) {
  const { isEditMode } = useEditMode();
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const [showSaved, setShowSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const saveMutation = useMutation({
    mutationFn: async (newValue: string) => {
      if (settingKey) {
        await apiRequest("PATCH", `/api/admin/site-settings/${settingKey}`, { value: newValue });
      } else if (entityType === "subject" && entityId) {
        await apiRequest("PUT", `/api/admin/subjects/${entityId}`, { [field]: newValue });
      } else if (entityType === "topic" && entityId) {
        await apiRequest("PUT", `/api/admin/topics/${entityId}`, { [field]: newValue });
      } else if (entityType === "material" && entityId) {
        await apiRequest("PUT", `/api/admin/materials/${entityId}`, { [field]: newValue });
      }
      return newValue;
    },
    onSuccess: (newValue) => {
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 1500);
      if (settingKey) {
        queryClient.invalidateQueries({ queryKey: ["/api/site-settings"] });
      } else if (entityType === "subject") {
        queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      } else if (entityType === "topic") {
        queryClient.invalidateQueries({ queryKey: ["/api/topics"] });
      } else if (entityType === "material") {
        queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      }
      onSave?.(newValue);
    },
  });

  const handleSave = () => {
    if (currentValue !== value && currentValue.trim()) {
      saveMutation.mutate(currentValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setCurrentValue(value);
      setIsEditing(false);
    }
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    handleSave();
  };

  if (!isEditMode) {
    return <Component className={className}>{value || placeholder}</Component>;
  }

  if (isEditing) {
    return (
      <span className="relative inline-flex items-center gap-1">
        <input
          ref={inputRef}
          type="text"
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className={cn(
            "bg-transparent border-b-2 border-primary focus:outline-none",
            className
          )}
          data-testid={`input-editable-${settingKey || entityType}`}
        />
        {showSaved && (
          <Check className="w-4 h-4 text-green-500 animate-pulse" />
        )}
      </span>
    );
  }

  return (
    <Component
      onClick={() => setIsEditing(true)}
      className={cn(
        "cursor-pointer border border-dashed border-indigo-400 rounded px-1 group inline-flex items-center gap-1 transition-colors",
        "hover:bg-indigo-50 dark:hover:bg-indigo-900/20",
        className
      )}
      data-testid={`editable-${settingKey || entityType}`}
    >
      {currentValue || placeholder}
      <Pencil className="w-3 h-3 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      {showSaved && (
        <Check className="w-4 h-4 text-green-500 animate-pulse" />
      )}
    </Component>
  );
}
