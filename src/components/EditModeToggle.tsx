import { useEditMode } from "@/contexts/EditModeContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";

const ADMIN_EMAIL = "durranisb768@gmail.com";

interface EditModeToggleProps {
  userEmail?: string | null;
}

export function EditModeToggle({ userEmail }: EditModeToggleProps) {
  const { isEditMode, toggleEditMode } = useEditMode();

  if (userEmail !== ADMIN_EMAIL) {
    return null;
  }

  return (
    <div 
      className={`flex items-center gap-2 px-3 py-1.5 rounded-md border transition-colors ${
        isEditMode 
          ? "bg-indigo-100 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700" 
          : "bg-background border-border"
      }`}
      data-testid="edit-mode-toggle-container"
    >
      <Pencil className={`w-4 h-4 ${isEditMode ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground"}`} />
      <Label 
        htmlFor="edit-mode" 
        className={`text-sm font-medium cursor-pointer ${isEditMode ? "text-indigo-700 dark:text-indigo-300" : ""}`}
      >
        Edit Mode
      </Label>
      <Switch
        id="edit-mode"
        checked={isEditMode}
        onCheckedChange={toggleEditMode}
        data-testid="switch-edit-mode"
      />
    </div>
  );
}
