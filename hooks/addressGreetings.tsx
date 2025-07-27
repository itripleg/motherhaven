// hooks/addressGreetings.tsx
import { useReadContract } from "wagmi";
import { Address } from "viem";

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
    },
  });

  return vanityName && vanityName.trim() !== "" ? vanityName : null;
}

// Enhanced greeting function that uses vanity names
export function useAddressGreeting(address?: Address) {
  const vanityName = useVanityName(address);

  // If user has a vanity name, use personalized greeting
  if (vanityName) {
    const randomVanityGreeting =
      vanityNameGreetings[
        Math.floor(Math.random() * vanityNameGreetings.length)
      ];
    return `${randomVanityGreeting}${vanityName}!`;
  }

  // Fallback to original random greeting
  return getAddressGreeting(address);
}

// Original function for backwards compatibility
export function getAddressGreeting(address?: string) {
  const randomGreeting =
    addressGreetings[Math.floor(Math.random() * addressGreetings.length)];

  return randomGreeting;
}

// Simple function to get display name (vanity name or shortened address)
export function useDisplayName(address?: Address) {
  const vanityName = useVanityName(address);

  if (vanityName) {
    return vanityName;
  }

  if (address) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  return "Guest";
}
