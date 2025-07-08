import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Pet | Testy the Dog",
  description: "Meet Testy, our beloved community pet! Feed them with tokens to keep them happy and healthy. Watch them grow, play, and interact with the community.",
  keywords: [
    "community pet",
    "tamagotchi",
    "web3 pet",
    "token burning",
    "blockchain pet",
    "crypto pet",
    "DeFi pet",
    "Testy",
    "community engagement"
  ],
  openGraph: {
    title: "Testy the Community Pet",
    description: "Our beloved community pet needs your care! Feed Testy with tokens to keep them happy and healthy.",
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
    description: "Feed our community pet with tokens to keep them happy and healthy!",
    images: ["/api/og/pet"],
  },
};

interface PetLayoutProps {
  children: React.ReactNode;
}

export default function PetLayout({ children }: PetLayoutProps) {
  return (
    <div className="pet-layout">
      {/* Pet-specific styles and providers can go here */}
      <style jsx global>{`
        /* Pet-specific CSS variables and overrides */
        .pet-layout {
          --pet-primary: hsl(45, 85%, 60%); /* Golden/yellow for dog theme */
          --pet-secondary: hsl(30, 70%, 50%); /* Warm brown */
          --pet-accent: hsl(15, 80%, 60%); /* Playful orange */
          --pet-background: hsl(220, 15%, 8%); /* Dark background */
          --pet-surface: hsl(220, 15%, 12%); /* Card backgrounds */
        }

        /* Pet page specific animations */
        .bone-float {
          animation: bone-float 3s ease-in-out infinite;
        }

        @keyframes bone-float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-10px) rotate(5deg);
          }
        }

        /* Pet mood colors */
        .mood-ecstatic { color: hsl(280, 100%, 70%); }
        .mood-happy { color: hsl(120, 60%, 60%); }
        .mood-content { color: hsl(200, 50%, 60%); }
        .mood-sad { color: hsl(45, 70%, 60%); }
        .mood-depressed { color: hsl(30, 60%, 50%); }
        .mood-miserable { color: hsl(0, 60%, 50%); }

        /* Pet action colors */
        .action-sleeping { color: hsl(240, 30%, 70%); }
        .action-playing { color: hsl(120, 60%, 60%); }
        .action-eating { color: hsl(45, 80%, 60%); }
        .action-exploring { color: hsl(200, 60%, 60%); }
        .action-resting { color: hsl(280, 40%, 70%); }
        .action-socializing { color: hsl(320, 60%, 70%); }
        .action-dreaming { color: hsl(260, 50%, 70%); }
        .action-exercising { color: hsl(30, 70%, 60%); }

        /* Pet health bar colors */
        .health-critical { 
          background: linear-gradient(90deg, hsl(0, 80%, 50%), hsl(15, 70%, 45%));
        }
        .health-low { 
          background: linear-gradient(90deg, hsl(30, 80%, 50%), hsl(45, 70%, 45%));
        }
        .health-medium { 
          background: linear-gradient(90deg, hsl(60, 70%, 50%), hsl(80, 60%, 45%));
        }
        .health-good { 
          background: linear-gradient(90deg, hsl(100, 60%, 50%), hsl(120, 60%, 45%));
        }
        .health-excellent { 
          background: linear-gradient(90deg, hsl(120, 70%, 50%), hsl(140, 60%, 45%));
        }

        /* Smooth transitions for stat changes */
        .pet-stat-bar {
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .pet-stat-number {
          transition: all 0.5s ease-out;
        }

        /* Pet avatar animations */
        .pet-avatar {
          transition: transform 0.3s ease-out;
        }

        .pet-avatar:hover {
          transform: scale(1.05);
        }

        .pet-avatar.sleeping {
          animation: gentle-bob 4s ease-in-out infinite;
        }

        .pet-avatar.playing {
          animation: excited-bounce 1s ease-in-out infinite;
        }

        .pet-avatar.dead {
          filter: grayscale(100%) brightness(0.7);
          animation: none;
        }

        @keyframes gentle-bob {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }

        @keyframes excited-bounce {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-8px) scale(1.02); }
        }

        /* Warning pulse animation */
        .warning-pulse {
          animation: warning-pulse 2s ease-in-out infinite;
        }

        @keyframes warning-pulse {
          0%, 100% { 
            box-shadow: 0 0 0 0 hsl(var(--destructive) / 0.7);
          }
          50% { 
            box-shadow: 0 0 0 10px hsl(var(--destructive) / 0);
          }
        }

        /* Success celebration animation */
        .celebration {
          animation: celebration 0.6s ease-out;
        }

        @keyframes celebration {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }

        /* Feeding button special effects */
        .feed-button {
          position: relative;
          overflow: hidden;
        }

        .feed-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s;
        }

        .feed-button:hover::before {
          left: 100%;
        }

        /* Pet message bubble */
        .pet-message {
          position: relative;
          background: hsl(var(--background));
          border: 2px solid hsl(var(--border));
          border-radius: 1rem;
          padding: 1rem;
          margin-top: 1rem;
        }

        .pet-message::before {
          content: '';
          position: absolute;
          bottom: -10px;
          left: 2rem;
          width: 0;
          height: 0;
          border-left: 10px solid transparent;
          border-right: 10px solid transparent;
          border-top: 10px solid hsl(var(--border));
        }

        .pet-message::after {
          content: '';
          position: absolute;
          bottom: -7px;
          left: 2.2rem;
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 8px solid hsl(var(--background));
        }

        /* Responsive adjustments for pet page */
        @media (max-width: 768px) {
          .pet-layout {
            padding: 0 1rem;
          }
          
          .pet-avatar {
            transform: scale(0.8);
          }
        }
      `}</style>
      
      {children}
    </div>
  );
}