"use client";

import { useState, useEffect } from "react";

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
          : "bg-blue-600 h-24"
      }`}
    >
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <h1
          className={`font-bold transition-all duration-300 ease-in-out ${
            scrolled ? "text-blue-600 text-2xl" : "text-white text-3xl"
          }`}
        >
          Sticky Header
        </h1>
        <nav>
          <ul className="flex space-x-4">
            {["Home", "About", "Services", "Contact"].map((item) => (
              <li key={item}>
                <a
                  href="#"
                  className={`transition-all duration-300 ease-in-out ${
                    scrolled ? "text-gray-800" : "text-white"
                  } hover:text-blue-300`}
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
    // </div>
  );
}
