"use client";
import { LandingPage } from "@/components/landing-page_old";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import SplashPage from "@/components/landing-page";

export default function Home() {
  const { isConnected } = useAccount();
  const router = useRouter();

  // Redirect connected users to DEX
  useEffect(() => {
    if (isConnected) {
      router.push("/dex");
    }
  }, [isConnected, router]);

  // Show landing page for non-connected users
  // return <LandingPage />;
  return <SplashPage />;
}
