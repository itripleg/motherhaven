// hooks/addressGreetings.tsx - FIXED: Prevents unnecessary re-renders
import { useReadContract } from "wagmi";
import { Address } from "viem";
import { useMemo } from "react";

const addressGreetings = [
  // Fuck boy
  "Yo! ",
  "Sup! ",
  "What's good! ",
  "Hey! ",
  "Lookin' slick! ",

  // Poker brat
  "High stakes! ",
  "Deal me in! ",
  "Bet big! ",
  "Fold or play! ",
  "Nice hand! ",
  "In the trenches!",

  // Skateboarder
  "Shred the chain! ",
  "Kickin' it! ",
  "Gnarly! ",
  "Catch the flow! ",
  "Roll on! ",

  // Rock star
  "Rockstar vibes! ",
  "Amp it up! ",
  "Let's jam! ",
  "Stay loud! ",
  "Encore moment! ",

  // Hippie
  "Peace! ",
  "Cosmic energy! ",
  "Groovy! ",
  "Far out! ",
  "Vibes aligned! ",
];

// Vanity name specific greetings
const vanityNameGreetings = [
  "Hey there, ",
  "Welcome back, ",
  "What's up, ",
  "Good to see you, ",
  "Ready to roll, ",
  "Let's go, ",
  "Time to shine, ",
  "Looking good, ",
  "Vibes are strong, ",
  "Energy's high, ",
];

// Contract addresses - should match your environment variables
const VANITY_BURN_MANAGER_ADDRESS = process.env
  .NEXT_PUBLIC_VANITY_BURN_MANAGER_ADDRESS as Address;

// Contract ABI for reading vanity names
const VANITY_BURN_MANAGER_ABI = [
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserVanityName",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Hook to get vanity name
export function useVanityName(address?: Address) {
  const { data: vanityName } = useReadContract({
    address: VANITY_BURN_MANAGER_ADDRESS,
    abi: VANITY_BURN_MANAGER_ABI,
    functionName: "getUserVanityName",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!VANITY_BURN_MANAGER_ADDRESS,
      refetchInterval: 10000, // Refetch every 10 seconds
      // 🔧 ADDED: Prevent unnecessary refetches
      staleTime: 30000, // Data is fresh for 30 seconds
      gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    },
  });

  return vanityName && vanityName.trim() !== "" ? vanityName : null;
}

// 🔧 FIXED: Generate truly random greeting but keep it stable for the session
function useStableRandomGreeting(address?: Address) {
  return useMemo(() => {
    // Generate truly random greeting regardless of address
    const index = Math.floor(Math.random() * addressGreetings.length);
    return addressGreetings[index];
  }, [address]); // Only recalculate when address changes (including undefined to defined)
}

// 🔧 FIXED: Generate truly random vanity greeting but keep it stable for the session
function useStableVanityGreeting(vanityName: string | null) {
  return useMemo(() => {
    if (!vanityName) return null;

    // Generate truly random greeting on first render, but keep it stable
    const index = Math.floor(Math.random() * vanityNameGreetings.length);
    return vanityNameGreetings[index];
  }, [vanityName]); // Only recalculate when vanityName changes
}

// 🔧 FIXED: Enhanced greeting function that uses vanity names WITHOUT re-renders
export function useAddressGreeting(address?: Address) {
  const vanityName = useVanityName(address);
  const stableRandomGreeting = useStableRandomGreeting(address);
  const stableVanityGreeting = useStableVanityGreeting(vanityName);

  // 🔧 FIXED: Memoize the final greeting
  return useMemo(() => {
    // If user has a vanity name, use personalized greeting
    if (vanityName && stableVanityGreeting) {
      return `${stableVanityGreeting}${vanityName}!`;
    }

    // Always return the stable random greeting (even for non-connected users)
    return stableRandomGreeting;
  }, [vanityName, stableVanityGreeting, stableRandomGreeting]);
}

// Original function for backwards compatibility - truly random each call
export function getAddressGreeting(address?: string) {
  const randomGreeting =
    addressGreetings[Math.floor(Math.random() * addressGreetings.length)];
  return randomGreeting;
}

// Simple function to get display name (vanity name or shortened address)
export function useDisplayName(address?: Address) {
  const vanityName = useVanityName(address);

  return useMemo(() => {
    if (vanityName) {
      return vanityName;
    }

    if (address) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    return "Guest";
  }, [vanityName, address]); // Only recalculate when these change
}
