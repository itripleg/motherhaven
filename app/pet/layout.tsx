import { Metadata } from "next";
import "./pet-styles.css";
import { PetEventWatcher } from "./components/PetEventWatcher";
import {AnimatedTestyPeek} from "./components/AnimatedTestyPeek"

export const metadata: Metadata = {
  title: "Community Pet | Testy the Dog",
  description:
    "Meet Testy, our beloved community pet! Feed them with tokens to keep them happy and healthy. Watch them grow, play, and interact with the community.",
  keywords: [
    "community pet",
    "tamagotchi",
    "web3 pet",
    "token burning",
    "blockchain pet",
    "crypto pet",
    "DeFi pet",
    "Testy",
    "community engagement",
  ],
  openGraph: {
    title: "Testy the Community Pet",
    description:
      "Our beloved community pet needs your care! Feed Testy with tokens to keep them happy and healthy.",
    type: "website",
    images: [
      {
        url: "/api/og/pet", // We can create a dynamic OG image later
        width: 1200,
        height: 630,
        alt: "Testy the Community Pet",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Testy the Community Pet",
    description:
      "Feed our community pet with tokens to keep them happy and healthy!",
    images: ["/api/og/pet"],
  },
};

interface PetLayoutProps {
  children: React.ReactNode;
}

export default function PetLayout({ children }: PetLayoutProps) {
  return (
    <div className="pet-layout p-200">
      <PetEventWatcher />
      {children}
    </div>
  );
}
