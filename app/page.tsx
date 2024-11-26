"use client";
// import { LandingPage } from "@/components/components-landing-page";
import { Dashboard } from "@/components/dashboard";
import { LandingPage } from "@/components/landing-page";
import LoginWidget from "@/components/login-widget";
import StickyHeader from "@/components/sticky-header";
// import AllWhoopsies from "@/components/AllWhoopsies";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import Image from "next/image";

export default function Home() {
  const { user } = useKindeBrowserClient();
  return (
    <>
      <LandingPage />
      {/* <GeneralLandingPage /> */}
      {/* <StickyHeader />
      Home{!user ? <LoginWidget /> : <Dashboard />} */}
    </>
  );
}
