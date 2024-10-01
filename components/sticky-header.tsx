"use client";

import { useState, useEffect } from "react";
import { ModeToggle } from "./mode-toggle";

export default function Component() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [scrolled]);

  return (
    // <div className="min-h-screen bg-gray-100">
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
        scrolled
          ? "bg-white bg-opacity-70 backdrop-blur-md h-16"
          : "bg-primary h-24"
      }`}
    >
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <h1
          className={`font-bold transition-all duration-300 ease-in-out ${
            scrolled ? "text-primary text-2xl" : "text-white text-3xl"
          }`}
        >
          <span className={scrolled ? "hidden" : ""}>Get </span>
          Munny
        </h1>
        <nav>
          <ul className="flex space-x-4">
            <li>
              <ModeToggle />
            </li>
          </ul>
        </nav>
      </div>
    </header>
    // </div>
  );
}
