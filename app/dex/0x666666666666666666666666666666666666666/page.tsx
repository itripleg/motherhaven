// app/dex/0x666666666666666666666666666666666666666/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Skull, 
  Eye, 
  Flame, 
  Zap, 
  Crown, 
  AlertTriangle,
  ArrowLeft,
  Copy,
  ExternalLink
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import OuijAi from "@/components-3d/Ouija/OuijaAndFletcha";

const CURSED_TOKEN = {
  address: "0x666666666666666666666666666666666666666",
  name: "Cursed Memecoin",
  symbol: "CURSE",
  description: "The forbidden token that should never have been found... Born from the depths of the digital underworld, this token carries the weight of ancient blockchain curses.",
  price: "6.66666666",
  createdAt: "06/06/2006 06:06:06",
  totalSupply: "666,666,666",
  holders: "13",
  volume24h: "666.666",
  marketCap: "4,444,444.44",
};

const CURSED_MESSAGES = [
  "The spirits whisper of great fortune...",
  "Ancient blockchain energies converge...",
  "The digital realm trembles...",
  "Hexadecimal prophecies unfold...",
  "The cryptographic veil grows thin...",
  "Satoshi's ghost stirs...",
  "The mining pools echo with whispers...",
  "Smart contracts writhe with forbidden knowledge...",
];

const GLITCH_CLASSES = [
  "animate-pulse",
  "animate-bounce",
  "animate-ping",
  "animate-spin",
];

export default function CursedTokenPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [glitchText, setGlitchText] = useState(CURSED_TOKEN.name);
  const [currentMessage, setCurrentMessage] = useState(CURSED_MESSAGES[0]);
  const [messageIndex, setMessageIndex] = useState(0);
  const [glitchClass, setGlitchClass] = useState("");
  const [showOuija, setShowOuija] = useState(false);
  const [eyeGlow, setEyeGlow] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  // Glitch effect for title
  useEffect(() => {
    const glitchInterval = setInterval(() => {
      const shouldGlitch = Math.random() < 0.3;
      if (shouldGlitch) {
        const randomClass = GLITCH_CLASSES[Math.floor(Math.random() * GLITCH_CLASSES.length)];
        setGlitchClass(randomClass);
        
        // Temporarily scramble text
        const scrambled = CURSED_TOKEN.name
          .split("")
          .map(char => Math.random() < 0.3 ? "666̴̈́" : char)
          .join("");
        setGlitchText(scrambled);
        
        setTimeout(() => {
          setGlitchText(CURSED_TOKEN.name);
          setGlitchClass("");
        }, 200);
      }
    }, 2000);

    return () => clearInterval(glitchInterval);
  }, []);

  // Rotating cursed messages
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % CURSED_MESSAGES.length);
    }, 3000);

    return () => clearInterval(messageInterval);
  }, []);

  useEffect(() => {
    setCurrentMessage(CURSED_MESSAGES[messageIndex]);
  }, [messageIndex]);

  // Eye glow effect
  useEffect(() => {
    const eyeInterval = setInterval(() => {
      setEyeGlow(prev => !prev);
    }, 1500);

    return () => clearInterval(eyeInterval);
  }, []);

  // Track cursor for spooky effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const copyAddress = () => {
    navigator.clipboard.writeText(CURSED_TOKEN.address);
    toast({
      title: "📋 Address Copied",
      description: "The cursed address has been copied to your clipboard...",
      className: "bg-red-950 border-red-600 text-red-100",
    });
  };

  const handleTrade = () => {
    toast({
      title: "⚠️ Trading Forbidden",
      description: "The cursed token cannot be traded by mere mortals...",
      variant: "destructive",
      className: "bg-red-950 border-red-600 text-red-100",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-950/20 to-purple-950/20 overflow-hidden relative">
      {/* Floating cursed symbols */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {Array.from({ length: 13 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-red-500/10 text-4xl select-none"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              rotate: [0, 360, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 6 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          >
            {["☠️", "👁️", "🔥", "⚡", "👑", "🖤", "💀"][i % 7]}
          </motion.div>
        ))}
      </div>

      {/* Mouse follower effect */}
      <motion.div
        className="fixed w-32 h-32 pointer-events-none z-50 mix-blend-screen"
        style={{
          background: "radial-gradient(circle, rgba(255,0,0,0.1) 0%, transparent 70%)",
        }}
        animate={{
          x: cursorPos.x - 64,
          y: cursorPos.y - 64,
        }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      />

      <div className="container mx-auto pt-20 p-4 relative z-10">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-red-400 hover:text-red-300 hover:bg-red-950/30 group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Escape the Curse
          </Button>
        </motion.div>

        {/* Main Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <Card className="bg-gradient-to-br from-red-950/30 to-purple-950/30 border-red-600/30 backdrop-blur-sm overflow-hidden relative">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-purple-500/5 to-red-500/5 animate-pulse" />
            
            <CardContent className="p-8 relative z-10">
              <div className="space-y-6">
                {/* Cursed Badge */}
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Badge className="bg-red-600 text-white border-red-500 px-4 py-2">
                    <Skull className="h-4 w-4 mr-2" />
                    CURSED TOKEN
                  </Badge>
                </motion.div>

                {/* Token Name with Glitch */}
                <div className="space-y-2">
                  <motion.h1
                    className={`text-6xl font-bold text-red-400 leading-tight ${glitchClass}`}
                    style={{
                      textShadow: "0 0 20px rgba(239, 68, 68, 0.5), 0 0 40px rgba(239, 68, 68, 0.2)",
                      fontFamily: "monospace",
                    }}
                  >
                    {glitchText}
                  </motion.h1>
                  <p className="text-red-300 text-lg font-mono">
                    ${CURSED_TOKEN.symbol}
                  </p>
                </div>

                {/* Address */}
                <div className="flex items-center justify-center gap-2 group cursor-pointer" onClick={copyAddress}>
                  <code className="text-red-400 font-mono text-sm bg-black/30 px-3 py-1 rounded border border-red-600/30">
                    {CURSED_TOKEN.address}
                  </code>
                  <Copy className="h-4 w-4 text-red-400 group-hover:text-red-300 transition-colors" />
                </div>

                {/* Description */}
                <p className="text-red-200/80 max-w-2xl mx-auto leading-relaxed">
                  {CURSED_TOKEN.description}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {[
            { label: "Current Price", value: `${CURSED_TOKEN.price} AVAX`, icon: Flame, color: "text-red-400" },
            { label: "Market Cap", value: `$${CURSED_TOKEN.marketCap}`, icon: Crown, color: "text-purple-400" },
            { label: "24h Volume", value: `${CURSED_TOKEN.volume24h} AVAX`, icon: Zap, color: "text-yellow-400" },
            { label: "Holders", value: CURSED_TOKEN.holders, icon: Eye, color: "text-green-400" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <Card className="bg-black/40 border-red-600/20 hover:border-red-600/40 transition-all group">
                <CardContent className="p-6 text-center">
                  <stat.icon className={`h-8 w-8 mx-auto mb-3 ${stat.color} ${eyeGlow && stat.icon === Eye ? 'animate-pulse' : ''}`} />
                  <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-red-300/60 text-sm">{stat.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Trading Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8"
        >
          {/* Warning Card */}
          <Card className="bg-gradient-to-br from-yellow-950/30 to-red-950/30 border-yellow-600/30">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-8 w-8 text-yellow-400 mt-1 animate-pulse" />
                <div>
                  <h3 className="text-xl font-bold text-yellow-400 mb-2">⚠️ CURSED WARNING</h3>
                  <p className="text-yellow-200/80 leading-relaxed">
                    This token carries ancient digital curses. Trading may result in unexpected 
                    blockchain phenomena, spontaneous smart contract hauntings, or permanent 
                    wallet possession by deceased DeFi protocols.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trading Actions */}
          <Card className="bg-black/40 border-red-600/20">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-red-400 mb-4">🔮 Cursed Trading</h3>
              <div className="space-y-4">
                <Button
                  onClick={handleTrade}
                  className="w-full bg-red-600 hover:bg-red-700 text-white group"
                  disabled
                >
                  <Skull className="h-4 w-4 mr-2 group-hover:animate-spin" />
                  Trade (Forbidden)
                </Button>
                
                <Button
                  onClick={() => setShowOuija(!showOuija)}
                  variant="outline"
                  className="w-full border-purple-600/50 text-purple-400 hover:bg-purple-950/30"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Consult the Spirits
                </Button>

                <div className="text-center pt-4">
                  <p className="text-red-300/60 text-sm font-mono">
                    Created: {CURSED_TOKEN.createdAt}
                  </p>
                  <p className="text-red-300/60 text-xs mt-1">
                    "When the blockchain screams, only the cursed shall trade..."
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Mystical Messages */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="text-center mb-8"
        >
          <Card className="bg-purple-950/20 border-purple-600/30 max-w-2xl mx-auto">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Eye className={`h-6 w-6 text-purple-400 ${eyeGlow ? 'animate-pulse' : ''}`} />
                <h3 className="text-lg font-semibold text-purple-400">The Spirits Speak</h3>
                <Eye className={`h-6 w-6 text-purple-400 ${eyeGlow ? 'animate-pulse' : ''}`} />
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentMessage}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-purple-200 italic font-serif"
                >
                  "{currentMessage}"
                </motion.p>
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Ouija Board */}
        <AnimatePresence>
          {showOuija && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowOuija(false)}
            >
              <Card className="bg-black/90 border-purple-600/50 max-w-4xl w-full max-h-[80vh] overflow-hidden">
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <h2 className="text-2xl font-bold text-purple-400 mb-2">🔮 Digital Séance</h2>
                    <p className="text-purple-200/80">The spirits of the blockchain await your questions...</p>
                  </div>
                  
                  <div className="h-96 flex items-center justify-center">
                    <OuijAi onResultChange={(result) => {
                      console.log("Ouija result:", result);
                    }} />
                  </div>
                  
                  <div className="text-center mt-4">
                    <Button
                      onClick={() => setShowOuija(false)}
                      variant="ghost"
                      className="text-purple-400 hover:text-purple-300"
                    >
                      Close the Portal
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="text-center py-8"
        >
          <p className="text-red-400/60 text-sm font-mono">
            🏴‍☠️ "In code we trust, in curses we dwell" 🏴‍☠️
          </p>
          <p className="text-red-300/40 text-xs mt-2">
            This page materialized from the digital void • Not financial advice, definitely cursed advice
          </p>
        </motion.div>
      </div>

      {/* CSS for additional spooky effects */}
      <style jsx>{`
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        .animate-flicker {
          animation: flicker 2s infinite;
        }
      `}</style>
    </div>
  );
}