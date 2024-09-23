"use client";
import { Dashboard } from "@/components/dashboard";
import LoginWidget from "@/components/login-widget";
// import AllWhoopsies from "@/components/AllWhoopsies";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import Image from "next/image";

export default function Home() {
  const { user } = useKindeBrowserClient();
  return <>{!user ? <LoginWidget /> : <Dashboard />}</>;
}
