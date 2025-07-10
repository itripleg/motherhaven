// app/roadmap/components/AdminForm.tsx
"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { RoadmapItem } from "../types";

interface AdminFormProps {
  isAdmin: boolean;
  onCustomSubmit?: (formData: {
    title: string;
    notes: string;
    status: RoadmapItem["status"];
  }) => Promise<void>;
}

export function AdminForm({ isAdmin, onCustomSubmit }: AdminFormProps) {
  const [title, setTitle] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [status, setStatus] =
    React.useState<RoadmapItem["status"]>("considering");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();

  const handleAddItem = async () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for the roadmap item.",
        variant: "destructive",
      });
      return;
    }

    if (title.length > 100) {
      toast({
        title: "Title too long",
        description: "Title must be 100 characters or less.",
        variant: "destructive",
      });
      return;
    }

    if (notes.length > 500) {
      toast({
        title: "Notes too long",
        description: "Notes must be 500 characters or less.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (onCustomSubmit) {
        // Use custom submit handler (for token roadmaps)
        await onCustomSubmit({
          title: title.trim(),
          notes: notes.trim(),
          status,
        });
      } else {
        // Default submit handler (for global roadmap)
        await addDoc(collection(db, "roadmap"), {
          title: title.trim(),
          status,
          notes: notes.trim(),
          upvotes: [],
          comments: [],
          createdAt: new Date().toISOString(),
        });

        toast({
          title: "Item added",
          description: "The roadmap item has been added successfully.",
        });
      }

      setTitle("");
      setNotes("");
      setStatus("considering");
    } catch (error) {
      console.error("Error adding roadmap item:", error);
      toast({
        title: "Error",
        description: "Failed to add roadmap item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <Card className="bg-card/50 border-border backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          Add Roadmap Item
          <Badge variant="outline" className="text-primary border-primary">
            Admin Only
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            placeholder="Item title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-card border-border text-foreground"
            maxLength={100}
            disabled={isSubmitting}
          />
          <div className="text-xs text-muted-foreground text-right">
            {title.length}/100 characters
          </div>
        </div>

        <div className="space-y-2">
          <Textarea
            placeholder="Admin notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="h-24 bg-card border-border text-foreground resize-none"
            maxLength={500}
            disabled={isSubmitting}
          />
          <div className="text-xs text-muted-foreground text-right">
            {notes.length}/500 characters
          </div>
        </div>

        <Select
          value={status}
          onValueChange={(value) => setStatus(value as RoadmapItem["status"])}
          disabled={isSubmitting}
        >
          <SelectTrigger className="bg-card border-border text-foreground">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="considering">Considering</SelectItem>
            <SelectItem value="planned">Planned</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Button
          onClick={handleAddItem}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          disabled={isSubmitting || !title.trim()}
        >
          <Plus className="h-4 w-4 mr-2" />
          {isSubmitting ? "Adding..." : "Add Item"}
        </Button>
      </CardContent>
    </Card>
  );
}
