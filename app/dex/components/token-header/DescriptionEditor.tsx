// app/dex/components/token-header/DescriptionEditor.tsx
"use client";
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Save, X, Edit, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DescriptionEditorProps {
  description?: string;
  isCreator?: boolean;
  onSave: (description: string) => Promise<boolean>;
  isUpdating?: boolean;
  className?: string;
}

export const DescriptionEditor: React.FC<DescriptionEditorProps> = ({
  description = "",
  isCreator = false,
  onSave,
  isUpdating = false,
  className = "",
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(description);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(value.length, value.length);
    }
  }, [isEditing, value.length]);

  // Reset value when description prop changes
  useEffect(() => {
    setValue(description);
  }, [description]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await onSave(value.trim());
      if (success) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Failed to save description:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setValue(description);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.metaKey) {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const displayDescription = description || "No description provided";
  const characterCount = value.length;
  const maxLength = 280; // Twitter-like limit

  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className={`space-y-3 ${className}`}
      >
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your token..."
            maxLength={maxLength}
            className="min-h-[80px] resize-none bg-black/40 border-primary/30 text-white placeholder:text-white/50 focus:border-primary focus:ring-primary/20"
          />

          {/* Character count */}
          <div className="absolute bottom-2 right-2 text-xs text-white/60">
            {characterCount}/{maxLength}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-white/60">
            Press ⌘+Enter to save, Esc to cancel
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving}
              className="h-7 px-3 text-white/80 hover:bg-red-500/20 hover:text-red-300"
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              disabled={isSaving || value.length === 0}
              className="h-7 px-3 text-primary hover:bg-primary/20"
            >
              {isSaving ? (
                <div className="h-3 w-3 border border-primary/30 border-t-primary rounded-full animate-spin mr-1" />
              ) : (
                <Save className="h-3 w-3 mr-1" />
              )}
              Save
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className={`group ${className}`}>
      <div className="flex items-start gap-2">
        <p className="text-white/70 text-sm lg:text-base max-w-2xl line-clamp-2 flex-1">
          {description ? (
            `"${description}"`
          ) : (
            <span className="italic text-white/50">{displayDescription}</span>
          )}
        </p>

        {isCreator && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(true)}
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:bg-primary/20 flex-shrink-0"
              >
                <Edit className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit description</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
};
