// app/dex/components/token-header/DescriptionEditor.tsx
"use client";
import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Save, X, Edit } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DescriptionEditorProps {
  description?: string;
  isCreator?: boolean;
  onSave: (description: string) => Promise<boolean>;
  isUpdating?: boolean;
  showEditButton?: boolean;
  forceEditing?: boolean;
  onCancel?: () => void;
  className?: string;
}

export interface DescriptionEditorRef {
  startEditing: () => void;
}

export const DescriptionEditor = forwardRef<
  DescriptionEditorRef,
  DescriptionEditorProps
>(
  (
    {
      description = "",
      isCreator = false,
      onSave,
      isUpdating = false,
      showEditButton = true,
      forceEditing = false,
      onCancel,
      className = "",
    },
    ref
  ) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(description);
    const [isSaving, setIsSaving] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Expose the startEditing method to parent component
    useImperativeHandle(ref, () => ({
      startEditing: () => setIsEditing(true),
    }));

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

    // Handle forceEditing prop
    useEffect(() => {
      if (forceEditing && !isEditing) {
        setIsEditing(true);
      }
    }, [forceEditing, isEditing]);

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
      // Call the external onCancel if provided
      if (onCancel) {
        onCancel();
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSave();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
      }
    };

    const displayDescription = description || "No description provided";
    const characterCount = value.length;
    const maxLength = 280;

    return (
      <div className={className}>
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="editing"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
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
                <div className="absolute bottom-2 right-2 text-xs text-white/60">
                  {characterCount}/{maxLength}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-white/60">
                  Press ⌘+Enter to save, Esc to cancel
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="h-7 w-7 text-white/80 hover:bg-red-500/20 hover:text-red-300"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSave}
                    disabled={isSaving || value.length === 0}
                    className="h-7 w-7 text-primary hover:bg-primary/20"
                  >
                    {isSaving ? (
                      <div className="h-3 w-3 border border-primary/30 border-t-primary rounded-full animate-spin" />
                    ) : (
                      <Save className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="display"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="group"
            >
              <p className="text-white/70 text-sm lg:text-base max-w-2xl line-clamp-2">
                {description ? (
                  `"${description}"`
                ) : (
                  <span className="italic text-white/50">
                    {displayDescription}
                  </span>
                )}
              </p>

              {/* Optional inline edit button (hidden by default when showEditButton=false) */}
              {isCreator && showEditButton && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsEditing(true)}
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:bg-primary/20 flex-shrink-0 mt-2"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit description</TooltipContent>
                </Tooltip>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

DescriptionEditor.displayName = "DescriptionEditor";
