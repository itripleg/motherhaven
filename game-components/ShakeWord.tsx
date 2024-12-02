import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";

const getRandomDelay = () => -(Math.random() * 0.2 + 0.1);
const randomDuration = () => Math.random() * 0.2 + 0.6;

const variants = {
  start: (i: number) => ({
    x: [0, Math.random() * 5, 0],
    y: [0, Math.random() * 5, 0],
    opacity: [1, 0.7, 1], // Added opacity animation
    scale: [1, 1.2, 1], // Added scale animation
    transition: {
      delay: getRandomDelay(),
      repeat: Infinity,
      duration: randomDuration(),
    },
  }),
  reset: {
    x: 0,
    y: 0,
    opacity: 1,
    scale: 1,
  },
};

type Props = { word: string };

export default function ShakeWord({ word }: Props) {
  const controls = useAnimation();
  useEffect(() => {
    setTimeout(() => {
      controls.start("start");
    }, 10); // Adjust the delay as needed
  }, [controls]);

  return (
    <div className="">
      <div className="flex">
        {word.split("").map((letter, index) => (
          <motion.div
            key={index}
            variants={variants}
            animate={controls}
            className="p-[4px]"
          >
            {letter}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
