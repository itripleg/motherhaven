"use client";

import { Button } from "@/components/ui/button";
import { Palette } from "lucide-react";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ModeToggle() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon" asChild>
            <Link href="/theme">
              <Palette className="h-[1.2rem] w-[1.2rem] transition-all" />
              <span className="sr-only">Open theme customizer</span>
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Customize theme</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
