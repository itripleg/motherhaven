// components/fidget/RandomTypingGame.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

// A small list of common words for demo purposes
const VALID_WORDS = [
  "the",
  "be",
  "to",
  "of",
  "and",
  "a",
  "in",
  "that",
  "have",
  "I",
  "it",
  "for",
  "not",
  "on",
  "with",
  "he",
  "as",
  "you",
  "do",
  "at",
  "this",
  "but",
  "his",
  "by",
  "from",
  "they",
  "we",
  "say",
  "her",
  "she",
  "or",
  "an",
  "will",
  "my",
  "one",
  "all",
  "would",
  "there",
  "their",
  "what",
  "so",
  "up",
  "out",
  "if",
  "about",
  "who",
  "get",
  "which",
  "go",
  "me",
  "when",
  "make",
  "can",
  "like",
  "time",
  "no",
  "just",
  "him",
  "know",
  "take",
  "people",
  "into",
  "year",
  "your",
  "good",
  "some",
  "could",
  "them",
  "see",
  "other",
  "than",
  "then",
  "now",
  "look",
  "only",
  "come",
  "its",
  "over",
  "think",
  "also",
  "back",
  "after",
  "use",
  "two",
  "how",
  "our",
  "work",
  "first",
  "well",
  "way",
  "even",
  "new",
  "want",
  "because",
  "any",
  "these",
  "give",
  "day",
  "most",
  "us",
];

interface RandomTypingGameProps {
  embedded?: boolean;
}

export default function RandomTypingGame({
  embedded = false,
}: RandomTypingGameProps) {
  const [input, setInput] = useState<string>("");
  const [wordCount, setWordCount] = useState<number>(0);
  const [wordsFound, setWordsFound] = useState<Map<string, number>>(new Map());
  const [streak, setStreak] = useState<number>(0);
  const [streakProgress, setStreakProgress] = useState<number>(100);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Manage streak progress bar
  useEffect(() => {
    let animationFrame: number;
    let lastTimestamp: number = Date.now();

    const updateStreakProgress = (timestamp: number) => {
      const delta = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      // Decrease streak faster if no word found recently (5 seconds max streak duration)
      const decreaseRate = 20 / 5000; // 100% over 5 seconds

      setStreakProgress((prevProgress) => {
        const newProgress = Math.max(0, prevProgress - decreaseRate * delta);

        // Reset streak if progress hits 0
        if (newProgress === 0 && streak > 0) {
          setStreak(0);
          toast({
            title: "Streak lost!",
            description: "Your typing streak has reset.",
            variant: "destructive",
          });
        }

        return newProgress;
      });

      animationFrame = requestAnimationFrame(updateStreakProgress);
    };

    animationFrame = requestAnimationFrame(updateStreakProgress);

    return () => cancelAnimationFrame(animationFrame);
  }, [streak]);

  // Check for valid words in the input string
  const checkForWords = (text: string) => {
    // Look for words in the last 30 characters (sliding window approach)
    const tailText = text.slice(Math.max(0, text.length - 30));
    const words = tailText
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter((w) => w.length > 0);

    for (const word of words) {
      if (word.length > 1 && VALID_WORDS.includes(word)) {
        // Found a valid word!
        const currentCount = wordsFound.get(word) || 0;
        const newCount = currentCount + 1;

        // Update the word map with new count
        setWordsFound((prev) => new Map(prev).set(word, newCount));

        if (currentCount === 0) {
          // First time finding this word
          toast({
            title: "New word found!",
            description: `You found the word "${word}"`,
          });
        } else {
          // Found this word again
          toast({
            title: "Word found again!",
            description: `"${word}" x${newCount}`,
          });
        }

        // Update word count and streak
        setWordCount((prev) => prev + 1);
        setStreak((prev) => prev + 1);
        setStreakProgress(100);

        break;
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInput = e.target.value;
    setInput(newInput);
    checkForWords(newInput);

    // Keep the input from getting too long by only keeping the last 50 characters
    if (newInput.length > 50) {
      setInput(newInput.slice(newInput.length - 50));
    }
  };

  // Convert the words found Map to an array for display
  const wordsList = Array.from(wordsFound.entries())
    .sort((a, b) => b[1] - a[1]) // Sort by count (highest first)
    .slice(0, 10); // Only show top 10

  return (
    <div
      className={`flex flex-col gap-${embedded ? "2" : "4"} h-full text-white`}
    >
      {!embedded && (
        <h2 className="text-2xl font-semibold text-center">
          Random Typing Game
        </h2>
      )}

      <p className={`text-center text-gray-300 ${embedded ? "text-xs" : ""}`}>
        Just type random letters! We'll count how many real words you
        accidentally make.
      </p>

      {/* Typing stats */}
      <div className="flex gap-4 justify-center">
        <div className="flex flex-col items-center">
          <span className={`${embedded ? "text-sm" : "text-lg"} font-medium`}>
            Words
          </span>
          <span className={`${embedded ? "text-xl" : "text-3xl"} font-bold`}>
            {wordCount}
          </span>
        </div>

        <div className="flex flex-col items-center">
          <span className={`${embedded ? "text-sm" : "text-lg"} font-medium`}>
            Streak
          </span>
          <span className={`${embedded ? "text-xl" : "text-3xl"} font-bold`}>
            {streak}
          </span>
        </div>
      </div>

      {/* Streak progress bar */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-gray-300">Streak Timer</span>
        <Progress value={streakProgress} className="h-1.5" />
      </div>

      {/* Input field - continuous typing experience */}
      <Input
        ref={inputRef}
        type="text"
        placeholder="Just type randomly..."
        value={input}
        onChange={handleInputChange}
        className={`${
          embedded ? "text-sm px-2 py-1" : "text-lg px-4 py-6"
        } bg-gray-800 border-gray-700 text-white placeholder-gray-500`}
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
      />

      {/* Words found with counts */}
      <div className="flex flex-col gap-1 mt-1">
        <h3 className={`${embedded ? "text-xs" : "text-md"} font-medium`}>
          Words Found:
        </h3>
        <div className="flex flex-wrap gap-1">
          {wordsList.map(([word, count]) => (
            <Badge
              key={word}
              variant="secondary"
              className={`${
                embedded ? "text-xs px-1 py-0" : "text-sm"
              } bg-gray-700`}
            >
              {word}{" "}
              {count > 1 && <span className="ml-1 opacity-70">x{count}</span>}
            </Badge>
          ))}
          {wordsList.length === 0 && (
            <span className="text-gray-400 italic text-xs">
              No words found yet. Keep typing!
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
