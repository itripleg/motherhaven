"use client";

import { UserSection } from "@/components/UserSection";

export const Header = () => {
  return (
    <header className="w-full px-4 py-16 ">
      <div className="container mx-auto">
        <UserSection />
      </div>
    </header>
  );
};
