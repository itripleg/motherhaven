// app/dex/components/roadmap/feature-posts/FeaturePostAdminForm.tsx
"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Star, StarOff, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/firebase";
import { FeaturePost, FEATURE_POST_LIMITS } from "./types";

interface FeaturePostAdminFormProps {
  isAdmin: boolean;
  tokenAddress?: string;
  onPostCreated?: () => void;
  editingPost?: FeaturePost | null;
  onCancelEdit?: () => void;
}

export function FeaturePostAdminForm({
  isAdmin,
  tokenAddress,
  onPostCreated,
  editingPost,
  onCancelEdit,
}: FeaturePostAdminFormProps) {
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [isFeatured, setIsFeatured] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);

  const { toast } = useToast();

  // Initialize form when editing
  React.useEffect(() => {
    if (editingPost) {
      setTitle(editingPost.title);
      setContent(editingPost.content);
      setIsFeatured(editingPost.isFeatured);
      setShowForm(true);
    } else {
      setTitle("");
      setContent("");
      setIsFeatured(false);
      setShowForm(false);
    }
  }, [editingPost]);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setIsFeatured(false);
    setShowForm(false);
    if (onCancelEdit) onCancelEdit();
  };

  const validateForm = () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for the feature post.",
        variant: "destructive",
      });
      return false;
    }

    if (title.length > FEATURE_POST_LIMITS.TITLE_MAX_LENGTH) {
      toast({
        title: "Title too long",
        description: `Title must be ${FEATURE_POST_LIMITS.TITLE_MAX_LENGTH} characters or less.`,
        variant: "destructive",
      });
      return false;
    }

    if (!content.trim()) {
      toast({
        title: "Content required",
        description: "Please enter content for the feature post.",
        variant: "destructive",
      });
      return false;
    }

    if (content.length > FEATURE_POST_LIMITS.CONTENT_MAX_LENGTH) {
      toast({
        title: "Content too long",
        description: `Content must be ${FEATURE_POST_LIMITS.CONTENT_MAX_LENGTH} characters or less.`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleFeatureToggle = async (checked: boolean) => {
    if (checked) {
      // Check if there's already a featured post
      try {
        const collectionName = tokenAddress
          ? "tokenFeaturePosts"
          : "featurePosts";
        const q = query(
          collection(db, collectionName),
          where("isFeatured", "==", true),
          ...(tokenAddress
            ? [where("tokenAddress", "==", tokenAddress.toLowerCase())]
            : [])
        );

        const existingFeatured = await getDocs(q);

        if (!existingFeatured.empty) {
          toast({
            title: "Featured post exists",
            description:
              "Only one post can be featured at a time. The current featured post will be unfeatured.",
          });
        }
      } catch (error) {
        console.error("Error checking featured posts:", error);
      }
    }
    setIsFeatured(checked);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const collectionName = tokenAddress
        ? "tokenFeaturePosts"
        : "featurePosts";

      // If featuring this post, unfeature others first
      if (isFeatured) {
        const q = query(
          collection(db, collectionName),
          where("isFeatured", "==", true),
          ...(tokenAddress
            ? [where("tokenAddress", "==", tokenAddress.toLowerCase())]
            : [])
        );

        const existingFeatured = await getDocs(q);
        const unfeaturedPromises = existingFeatured.docs.map((doc) =>
          updateDoc(doc.ref, { isFeatured: false })
        );
        await Promise.all(unfeaturedPromises);
      }

      const postData = {
        title: title.trim(),
        content: content.trim(),
        isFeatured,
        upvotes: [],
        comments: [],
        ...(tokenAddress && { tokenAddress: tokenAddress.toLowerCase() }),
      };

      if (editingPost) {
        // Update existing post
        await updateDoc(doc(db, collectionName, editingPost.id), {
          ...postData,
          updatedAt: serverTimestamp(),
        });

        toast({
          title: "Post updated",
          description: "The feature post has been updated successfully.",
        });
      } else {
        // Create new post
        await addDoc(collection(db, collectionName), {
          ...postData,
          createdAt: serverTimestamp(),
        });

        toast({
          title: "Post created",
          description: "The feature post has been created successfully.",
        });
      }

      resetForm();
      if (onPostCreated) onPostCreated();
    } catch (error) {
      console.error("Error saving feature post:", error);
      toast({
        title: "Error",
        description: "Failed to save feature post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingPost) return;

    if (
      !confirm(
        "Are you sure you want to delete this feature post? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsSubmitting(true);

    try {
      const collectionName = tokenAddress
        ? "tokenFeaturePosts"
        : "featurePosts";
      await deleteDoc(doc(db, collectionName, editingPost.id));

      toast({
        title: "Post deleted",
        description: "The feature post has been deleted successfully.",
      });

      resetForm();
      if (onPostCreated) onPostCreated();
    } catch (error) {
      console.error("Error deleting feature post:", error);
      toast({
        title: "Error",
        description: "Failed to delete feature post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="space-y-4">
      {/* Toggle Button */}
      {!showForm && !editingPost && (
        <Button
          onClick={() => setShowForm(true)}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Feature Post
        </Button>
      )}

      {/* Form */}
      <AnimatePresence>
        {(showForm || editingPost) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <Card className="bg-card/50 border-border backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {editingPost ? (
                      <Edit className="h-5 w-5 text-primary" />
                    ) : (
                      <Plus className="h-5 w-5 text-primary" />
                    )}
                    {editingPost ? "Edit Feature Post" : "Add Feature Post"}
                    <Badge
                      variant="outline"
                      className="text-primary border-primary"
                    >
                      Admin Only
                    </Badge>
                  </div>
                  {editingPost && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleDelete}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                      disabled={isSubmitting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Title Input */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="Feature post title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="bg-card border-border text-foreground"
                      maxLength={FEATURE_POST_LIMITS.TITLE_MAX_LENGTH}
                      disabled={isSubmitting}
                    />
                    <div className="text-xs text-muted-foreground text-right">
                      {title.length}/{FEATURE_POST_LIMITS.TITLE_MAX_LENGTH}{" "}
                      characters
                    </div>
                  </div>

                  {/* Content Input */}
                  <div className="space-y-2">
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      placeholder="Feature post content..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="h-32 bg-card border-border text-foreground resize-none"
                      maxLength={FEATURE_POST_LIMITS.CONTENT_MAX_LENGTH}
                      disabled={isSubmitting}
                    />
                    <div className="text-xs text-muted-foreground text-right">
                      {content.length}/{FEATURE_POST_LIMITS.CONTENT_MAX_LENGTH}{" "}
                      characters
                    </div>
                  </div>

                  {/* Featured Toggle */}
                  <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-2">
                      {isFeatured ? (
                        <Star className="h-4 w-4 text-yellow-400" />
                      ) : (
                        <StarOff className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div>
                        <Label
                          htmlFor="featured"
                          className="text-sm font-medium"
                        >
                          Featured Post
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Featured posts appear at the top
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="featured"
                      checked={isFeatured}
                      onCheckedChange={handleFeatureToggle}
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        isSubmitting || !title.trim() || !content.trim()
                      }
                      className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          {editingPost ? "Updating..." : "Creating..."}
                        </div>
                      ) : (
                        <>
                          {editingPost ? (
                            <Edit className="h-4 w-4 mr-2" />
                          ) : (
                            <Plus className="h-4 w-4 mr-2" />
                          )}
                          {editingPost ? "Update Post" : "Create Post"}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
