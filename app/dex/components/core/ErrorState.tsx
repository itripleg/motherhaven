// app/dex/components/core/ErrorState.tsx
"use client";

import React from "react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  showBackButton?: boolean;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  message = "An unexpected error occurred",
  showBackButton = false,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="min-h-screen animated-bg floating-particles">
      <div className="container mx-auto pt-20 p-4">
        <div className="flex flex-col justify-center items-center min-h-[70vh] text-center space-y-6">
          <div className="text-8xl">🤔</div>
          <div className="space-y-4 max-w-md">
            <h2 className="text-3xl font-bold text-red-400">{title}</h2>
            <p className="text-muted-foreground leading-relaxed">{message}</p>
            <div className="flex gap-4 justify-center">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="btn-primary px-8 py-3 rounded-xl font-semibold"
                >
                  Try Again
                </button>
              )}
              {showBackButton && (
                <button
                  onClick={() => window.history.back()}
                  className="btn-secondary px-8 py-3 rounded-xl font-semibold"
                >
                  ← Go Back
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
