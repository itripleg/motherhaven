// app/dex/components/roadmap/feature-posts/FeaturePostsList.tsx
"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Star,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
  QueryConstraint,
} from "firebase/firestore";
import { db } from "@/firebase";
import { FeaturePost } from "./types";
import { FeaturePostDisplay } from "./FeaturePostDisplay";
import { FeaturePostAdminForm } from "./FeaturePostAdminForm";

interface FeaturePostsListProps {
  address?: string;
  isConnecting: boolean;
  isAdmin?: boolean;
  tokenAddress?: string; // If provided, shows token-specific posts
  carousel?: boolean; // New prop to enable carousel mode
}

type SortBy = "newest" | "oldest" | "popular";

export function FeaturePostsList({
  address,
  isConnecting,
  isAdmin = false,
  tokenAddress,
  carousel = false,
}: FeaturePostsListProps) {
  const [posts, setPosts] = React.useState<FeaturePost[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [sortBy, setSortBy] = React.useState<SortBy>("newest");
  const [editingPost, setEditingPost] = React.useState<FeaturePost | null>(
    null
  );
  const [mounted, setMounted] = React.useState(false);
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const { toast } = useToast();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch posts from Firestore
  React.useEffect(() => {
    if (!mounted) return;

    setLoading(true);

    const collectionName = tokenAddress ? "tokenFeaturePosts" : "featurePosts";
    const constraints: QueryConstraint[] = [];

    // Add token filter if specified
    if (tokenAddress) {
      constraints.push(where("tokenAddress", "==", tokenAddress.toLowerCase()));
    }

    // Default ordering by creation date (newest first) - we'll sort featured posts on client side
    constraints.push(orderBy("createdAt", "desc"));

    const q = query(collection(db, collectionName), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedPosts: FeaturePost[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          fetchedPosts.push({
            id: doc.id,
            title: data.title || "",
            content: data.content || "",
            isFeatured: data.isFeatured || false,
            createdAt:
              data.createdAt?.toDate?.()?.toISOString() ||
              data.createdAt ||
              new Date().toISOString(),
            updatedAt:
              data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
            authorAddress:
              data.authorAddress ||
              "0x0000000000000000000000000000000000000000",
            upvotes: Array.isArray(data.upvotes) ? data.upvotes : [],
            comments: Array.isArray(data.comments) ? data.comments : [],
            tokenAddress: data.tokenAddress,
          });
        });
        setPosts(fetchedPosts);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching feature posts:", error);
        toast({
          title: "Error",
          description: "Failed to load feature posts",
          variant: "destructive",
        });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [mounted, tokenAddress, toast]);

  // Sort posts based on selected criteria
  const sortedPosts = React.useMemo(() => {
    const postsCopy = [...posts];

    // Always sort featured posts first
    postsCopy.sort((a, b) => {
      // Featured posts always come first
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;

      // If both or neither are featured, apply secondary sorting
      switch (sortBy) {
        case "popular":
          const aScore =
            (a.upvotes?.length || 0) + (a.comments?.length || 0) * 2;
          const bScore =
            (b.upvotes?.length || 0) + (b.comments?.length || 0) * 2;
          return bScore - aScore;

        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );

        case "newest":
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });

    return postsCopy;
  }, [posts, sortBy]);

  const handleEdit = (post: FeaturePost) => {
    setEditingPost(post);
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
  };

  const handlePostCreated = () => {
    setEditingPost(null);
    // Posts will be updated automatically via the onSnapshot listener
  };

  // Carousel navigation
  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? sortedPosts.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === sortedPosts.length - 1 ? 0 : prev + 1));
  };

  // Reset index when posts change
  React.useEffect(() => {
    if (currentIndex >= sortedPosts.length) {
      setCurrentIndex(0);
    }
  }, [sortedPosts.length, currentIndex]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-foreground">Loading posts...</p>
        </div>
      </div>
    );
  }

  // Carousel Mode (for non-admin views)
  if (carousel && !isAdmin) {
    return (
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {[
              { value: "newest" as SortBy, label: "Newest", icon: Clock },
              {
                value: "popular" as SortBy,
                label: "Popular",
                icon: TrendingUp,
              },
              { value: "oldest" as SortBy, label: "Oldest", icon: Clock },
            ].map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                variant={sortBy === value ? "default" : "ghost"}
                size="sm"
                onClick={() => setSortBy(value)}
                className="h-8 px-3 text-xs"
              >
                <Icon className="h-3 w-3 mr-1" />
                {label}
              </Button>
            ))}
          </div>

          {sortedPosts.length > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPrevious}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground min-w-[4rem] text-center">
                {currentIndex + 1} of {sortedPosts.length}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={goToNext}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Single Post Display */}
        {loading ? (
          <div className="h-32 bg-muted/20 rounded-lg animate-pulse" />
        ) : sortedPosts.length === 0 ? (
          <div className="text-center py-12">
            <div className="space-y-3">
              <div className="text-4xl opacity-30">📝</div>
              <div>
                <h3 className="text-lg font-medium text-foreground mb-1">
                  No feature posts yet
                </h3>
                <p className="text-sm text-muted-foreground">
                  Feature posts will appear here when available.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <FeaturePostDisplay
                post={sortedPosts[currentIndex]}
                address={address}
                isConnecting={isConnecting}
                isAdmin={false}
                tokenAddress={tokenAddress}
              />
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    );
  }

  // Regular List Mode (for admin views)
  return (
    <div className="space-y-6">
      {/* Admin Form */}
      {isAdmin && (
        <FeaturePostAdminForm
          isAdmin={isAdmin}
          tokenAddress={tokenAddress}
          onPostCreated={handlePostCreated}
          editingPost={editingPost}
          onCancelEdit={handleCancelEdit}
        />
      )}

      {/* Sort Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {[
            { value: "newest" as SortBy, label: "Newest", icon: Clock },
            { value: "popular" as SortBy, label: "Popular", icon: TrendingUp },
            { value: "oldest" as SortBy, label: "Oldest", icon: Clock },
          ].map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant={sortBy === value ? "default" : "ghost"}
              size="sm"
              onClick={() => setSortBy(value)}
              className="h-8 px-3 text-xs"
            >
              <Icon className="h-3 w-3 mr-1" />
              {label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {posts.filter((p) => p.isFeatured).length > 0 && (
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-400" />
              <span>Featured posts appear first</span>
            </div>
          )}
          <Badge variant="outline" className="text-xs">
            {posts.length} post{posts.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-32 bg-muted/20 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : sortedPosts.length === 0 ? (
        <div className="text-center py-12">
          <div className="space-y-3">
            <div className="text-4xl opacity-30">📝</div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-1">
                No feature posts yet
              </h3>
              <p className="text-sm text-muted-foreground">
                {isAdmin
                  ? "Create your first feature post to share updates and announcements."
                  : "Feature posts will appear here when available."}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <FeaturePostDisplay
                post={post}
                address={address}
                isConnecting={isConnecting}
                isAdmin={isAdmin}
                onEdit={handleEdit}
                tokenAddress={tokenAddress}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
