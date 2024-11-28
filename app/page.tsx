"use client";
// import { LandingPage } from "@/components/components-landing-page";
import { Dashboard } from "@/components/dashboard";
import { LandingPage } from "@/components/landing-page";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import Image from "next/image";
import { useAccount } from "wagmi";

export default function Home() {
  // const { user } = useKindeBrowserClient();
  const { isConnecting, isReconnecting, isConnected, isDisconnected } =
    useAccount();
  return <>{isConnected ? <Dashboard /> : <LandingPage />}</>;
}
