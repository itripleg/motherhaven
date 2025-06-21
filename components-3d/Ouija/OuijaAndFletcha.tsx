"use client";

import { Environment, PresentationControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { motion, useAnimation } from "framer-motion";
import { useEffect, useState } from "react";

import { Flecha } from "./Flecha";
import { OuijaBoard } from "./OuijaBoard";

interface OuijAiProps {
  onResultChange?: (result: string) => void;
}

function OuijaAndFlecha({ onResultChange }: OuijAiProps) {
  const [questionInput, setQuestionInput] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const animationControls = useAnimation();

  // Update the parent component whenever the result changes
  useEffect(() => {
    if (result && onResultChange) {
      onResultChange(result);
    }
  }, [result, onResultChange]);

  async function handleKeyPress(key: any) {
    // get the last key pressed and move ouija arrow
    // let lastKey = key[key.length - 1]
    // await animationControls.start(lastKey)
  }

  async function onSubmit(event: any) {
    event.preventDefault();
    try {
      setQuestionInput("");
      console.log("submitting...", questionInput);
      animationControls.start("default");

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: questionInput }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log("Response:", data.result);

      setResult(data.result);
    } catch (error) {
      console.error("Error:", error);
      setResult("[error]");
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 1 }}
        animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
        transition={{ duration: 1 }}
        className="hidden h-[520px] w-full max-w-4xl border border-black lg:h-[420px]"
      >
        <div className="hidden h-[50px]" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
      >
        <h1 className="text-center text-2xl uppercase tracking-[20px] text-white">
          <span className="text-red-800">Ask </span>
          Away
        </h1>
        <form onSubmit={onSubmit}>
          <div className="flex w-full justify-center px-6 py-6 lg:px-0">
            <input
              type="text"
              value={questionInput}
              className="w-full max-w-4xl p-2 text-black"
              onChange={(e) => {
                setQuestionInput(e.target.value);
                handleKeyPress(e.target.value.toLowerCase());
              }}
            />
          </div>
        </form>
      </motion.div>
      <div className="px-6 text-center italic">{result}</div>
    </>
  );
}

export default OuijaAndFlecha;
