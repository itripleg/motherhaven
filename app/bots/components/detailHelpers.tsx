import React from "react";
import { TrendingUp, Sword, Shield, Activity } from "lucide-react";

// --- INTERFACES ---
export interface BotCharacter {
  mood?: string;
  energy?: number;
  personality?: string;
  catchphrase?: string;
}

export interface BotLastAction {
  type: string;
  message: string;
  timestamp: string;
  details?: any;
}

export interface BotConfig {
  buyBias?: number;
  riskTolerance?: number;
  minInterval?: number;
  maxInterval?: number;
  minTradeAmount?: number;
  maxTradeAmount?: number;
  createTokenChance?: number;
  buyPhrases?: string[];
  sellPhrases?: string[];
}

export interface BotStatus {
  name: string;
  displayName: string;
  avatarUrl: string;
  bio?: string;
  isOnline: boolean;
  lastSeen: string;
  lastAction?: BotLastAction;
  totalActions: number;
  sessionStarted: string;
  character?: BotCharacter;
  config?: BotConfig;
}

export interface ActivityLog {
  id: string;
  action: string;
  message: string;
  timestamp: Date;
  tokenSymbol?: string;
  amount?: string;
}

// --- HELPER FUNCTIONS ---
export const getMoodColor = (mood?: string): string => {
  switch (mood) {
    case "bullish":
      return "text-green-400";
    case "aggressive":
      return "text-red-400";
    case "cautious":
      return "text-blue-400";
    default:
      return "text-gray-400";
  }
};

export const getMoodIcon = (mood?: string): React.ReactElement => {
  switch (mood) {
    case "bullish":
      return <TrendingUp className="h-4 w-4" />;
    case "aggressive":
      return <Sword className="h-4 w-4" />;
    case "cautious":
      return <Shield className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
};

export const getActionColor = (action: string): string => {
  switch (action.toLowerCase()) {
    case "buy":
      return "text-green-400 bg-green-500/10";
    case "sell":
      return "text-red-400 bg-red-500/10";
    case "create_token":
      return "text-purple-400 bg-purple-500/10";
    case "heartbeat":
      return "text-blue-400 bg-blue-500/10";
    default:
      return "text-gray-400 bg-gray-500/10";
  }
};
