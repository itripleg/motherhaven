// components/dashboard/Layout.tsx
"use client";

import { ReactNode } from "react";
import { Container } from "@/components/craft";
import { AuthWrapper } from "@/components/AuthWrapper";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AuthWrapper>
      <Container className="mt-8">
        <div className="grid gap-6 md:grid-cols-2 pt-12">{children}</div>
      </Container>
    </AuthWrapper>
  );
}

// components/dashboard/DashboardSection.tsx
interface DashboardSectionProps {
  children: ReactNode;
  fullWidth?: boolean;
}

export function DashboardSection({
  children,
  fullWidth = false,
}: DashboardSectionProps) {
  return <div className={`${fullWidth ? "col-span-2" : ""}`}>{children}</div>;
}
