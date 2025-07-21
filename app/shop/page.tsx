// app/shop/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins } from 'lucide-react';

// Import types - adjust path as needed
// import { type ShopItem, VANITY_BURN_MANAGER_ABI, VANITY_BURN_MANAGER_ADDRESS } from './types';

// Inline types for now to avoid import issues
interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  preview: string;
  position: { x: number; y: number };
  isAvailable: boolean;
  requiresBurnBalance?: number;
}

const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'vanity_name_change',
    name: 'Vanity Name Token',
    description: 'Change your display name',
    cost: 1000,
    rarity: 'common',
    preview: '📛',
    position: { x: 40, y: 40 },
    isAvailable: true,
    requiresBurnBalance: 1000,
  },
  {
    id: 'premium_name_reservation', 
    name: 'Premium Name Reserve',
    description: 'Reserve a name for 30 days',
    cost: 2500,
    rarity: 'rare',
    preview: '🛡️',
    position: { x: 60, y: 30 },
    isAvailable: false,
    requiresBurnBalance: 2500,
  },
  {
    id: 'rainbow_name_effect',
    name: 'Rainbow Name Effect', 
    description: 'Make your name shimmer',
    cost: 5000,
    rarity: 'epic',
    preview: '🌈',
    position: { x: 30, y: 60 },
    isAvailable: false,
    requiresBurnBalance: 5000,
  },
];

const RARITY_COLORS = {
  common: '#9CA3AF',
  rare: '#60A5FA', 
  epic: '#A78BFA',
  legendary: '#FBBF24',
} as const;

// This is the page component - NO PROPS ALLOWED
export default function ShopPage() {
  const { address } = useAccount();
  const [userBalance, setUserBalance] = useState(15000); // Default for testing
  const [hoveredItem, setHoveredItem] = useState<ShopItem | null>(null);
  const [merchantSays, setMerchantSays] = useState("Welcome, traveler...");

  // Uncomment when you have the contract setup
  // const { data: burnInfo } = useReadContract({
  //   address: VANITY_BURN_MANAGER_ADDRESS,
  //   abi: VANITY_BURN_MANAGER_ABI,
  //   functionName: 'getUserBurnInfo',
  //   args: address ? [address] : undefined,
  //   query: {
  //     enabled: !!address,
  //   },
  // });

  // useEffect(() => {
  //   if (burnInfo) {
  //     const availableBalance = Number(burnInfo[2]) / 1e18;
  //     setUserBalance(availableBalance);
  //   }
  // }, [burnInfo]);

  const handleItemHover = (item: ShopItem | null) => {
    setHoveredItem(item);
    if (item) {
      const canAfford = userBalance >= item.cost;
      setMerchantSays(canAfford 
        ? `${item.name} - ${item.cost.toLocaleString()} VAIN` 
        : `Need ${(item.cost - userBalance).toLocaleString()} more VAIN`
      );
    } else {
      setMerchantSays("Welcome, traveler...");
    }
  };

  const handleItemClick = (item: ShopItem) => {
    if (userBalance >= item.cost && item.isAvailable) {
      console.log('Purchasing item:', item);
      // TODO: Implement actual purchase logic
      setUserBalance(prev => prev - item.cost);
      alert(`Successfully purchased ${item.name}!`);
    }
  };

  const getRarityColor = (rarity: keyof typeof RARITY_COLORS) => {
    return RARITY_COLORS[rarity];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-accent/20">
      {/* Background elements with falling coins */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Static decorative elements */}
        <div className="absolute top-20 left-10 text-6xl opacity-5 blur-sm rotate-12">🏪</div>
        <div className="absolute bottom-20 right-10 text-5xl opacity-5 blur-sm -rotate-12">💎</div>
        <div className="absolute top-1/2 right-20 text-4xl opacity-5 blur-sm">✨</div>
        
        {/* Falling coins - giant ones */}
        {[
          { left: 15, delay: 0, duration: 25, size: 'text-[8rem]', rotation: 0, spinType: 'flip' },
          { left: 50, delay: 12, duration: 30, size: 'text-[10rem]', rotation: 180, spinType: 'spin' },
          { left: 85, delay: 8, duration: 28, size: 'text-[7rem]', rotation: 90, spinType: 'wobble' },
        ].map((coin, i) => (
          <motion.div
            key={`giant-coin-${i}`}
            className={`absolute ${coin.size} blur-sm opacity-15`}
            style={{ left: `${coin.left}%` }}
            initial={{
              y: "-200vh",
              opacity: 0,
              rotate: coin.rotation,
              scaleX: 1,
            }}
            animate={{
              y: "200vh",
              rotate: coin.spinType === 'spin' ? coin.rotation + 360 : coin.rotation,
              scaleX: coin.spinType === 'flip' ? [1, 0.2, -1, 0.2, 1] : coin.spinType === 'wobble' ? [1, 0.7, 1, 0.7, 1] : 1,
              opacity: [0, 0.15, 0.15, 0],
            }}
            transition={{
              duration: coin.duration,
              repeat: Infinity,
              delay: coin.delay,
              ease: "linear",
              times: [0, 0.1, 0.9, 1],
            }}
          >
            🪙
          </motion.div>
        ))}
        
        {/* Medium falling coins */}
        {[
          { left: 25, delay: 5, duration: 20, size: 'text-[4rem]', rotation: 45, spinType: 'flip' },
          { left: 65, delay: 15, duration: 22, size: 'text-[5rem]', rotation: 270, spinType: 'wobble' },
          { left: 35, delay: 20, duration: 18, size: 'text-[3rem]', rotation: 135, spinType: 'spin' },
        ].map((coin, i) => (
          <motion.div
            key={`medium-coin-${i}`}
            className={`absolute ${coin.size} blur-sm opacity-12`}
            style={{ left: `${coin.left}%` }}
            initial={{
              y: "-150vh",
              opacity: 0,
              rotate: coin.rotation,
              scaleX: 1,
            }}
            animate={{
              y: "150vh",
              rotate: coin.spinType === 'spin' ? coin.rotation + 360 : coin.rotation,
              scaleX: coin.spinType === 'flip' ? [1, 0.3, -1, 0.3, 1] : coin.spinType === 'wobble' ? [1, 0.8, 1, 0.8, 1] : 1,
              opacity: [0, 0.12, 0.12, 0],
            }}
            transition={{
              duration: coin.duration,
              repeat: Infinity,
              delay: coin.delay,
              ease: "linear",
              times: [0, 0.15, 0.85, 1],
            }}
          >
            🪙
          </motion.div>
        ))}
        
        {/* Small floating coins */}
        {[
          { left: 20, delay: 10, duration: 35, size: 'text-[2rem]', spinType: 'flip' },
          { left: 70, delay: 25, duration: 40, size: 'text-[1.5rem]', spinType: 'wobble' },
        ].map((coin, i) => (
          <motion.div
            key={`small-coin-${i}`}
            className={`absolute ${coin.size} blur-sm opacity-8`}
            style={{ left: `${coin.left}%`, top: '30%' }}
            animate={{
              y: [-10, 15, -10],
              x: [-5, 8, -5],
              rotate: [0, 180, 360],
              scaleX: coin.spinType === 'flip' ? [1, 0.4, -1, 0.4, 1] : [1, 1.1, 1],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: coin.duration,
              repeat: Infinity,
              delay: coin.delay,
              ease: "easeInOut",
            }}
          >
            🪙
          </motion.div>
        ))}
        
        {/* Floating particles */}
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-1 h-1 bg-primary/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 0.6, 0],
              scale: [0.5, 1.5, 0.5],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto p-6 pt-24 space-y-8">
        {/* Simple Header */}
        <motion.div 
          className="text-center space-y-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-6xl">🧙‍♂️</div>
          
          {/* Balance */}
          <Card className="w-fit mx-auto bg-card/80 backdrop-blur border-primary/30">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-primary" />
                <span className="font-bold text-lg">{userBalance.toLocaleString()}</span>
                <span className="text-primary text-sm">VAIN</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Shop Area */}
        <Card className="bg-card/80 backdrop-blur border-primary/20">
          <CardContent className="p-0">
            <motion.div
              className="relative w-full h-[500px] bg-gradient-to-br from-primary/5 via-accent/8 to-muted/15 rounded-lg"
              onMouseLeave={() => handleItemHover(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              {/* Simple border decoration */}
              <div className="absolute inset-6 border border-primary/20 rounded-lg"></div>

              {/* Pointing hand */}
              {hoveredItem && (
                <motion.div
                  className="absolute text-3xl pointer-events-none z-20"
                  style={{
                    left: `calc(${hoveredItem.position.x}% - 40px)`,
                    top: `calc(${hoveredItem.position.y}% + 80px)`,
                  }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  👉
                </motion.div>
              )}

              {/* Items */}
              {SHOP_ITEMS.map((item, index) => (
                <motion.div
                  key={item.id}
                  className={`absolute group ${item.isAvailable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                  style={{
                    left: `${item.position.x}%`,
                    top: `${item.position.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  whileHover={item.isAvailable ? { scale: 1.1, y: -5 } : {}}
                  onHoverStart={() => handleItemHover(item)}
                  onClick={() => handleItemClick(item)}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {/* Item */}
                  <div className="relative">
                    <div className="text-5xl mb-2 group-hover:scale-110 transition-transform">
                      {item.preview}
                    </div>
                    
                    {/* Price */}
                    <div 
                      className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 px-2 py-1 rounded text-xs font-bold border"
                      style={{ 
                        backgroundColor: `${getRarityColor(item.rarity)}15`,
                        borderColor: getRarityColor(item.rarity),
                        color: getRarityColor(item.rarity),
                      }}
                    >
                      {item.cost >= 1000 ? `${item.cost/1000}k` : item.cost}
                    </div>

                    {/* Rarity indicator */}
                    <div 
                      className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                      style={{ backgroundColor: getRarityColor(item.rarity) }}
                    />

                    {/* Unavailable overlay */}
                    {!item.isAvailable && (
                      <div className="absolute inset-0 bg-gray-500/50 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-bold text-white bg-gray-800 px-2 py-1 rounded">
                          Soon
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </CardContent>
        </Card>

        {/* Merchant Speech */}
        <motion.div className="text-center">
          <Card className="w-fit mx-auto bg-accent/20 backdrop-blur border-accent/40">
            <CardContent className="p-3">
              <motion.p
                key={merchantSays}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-accent-foreground font-medium"
              >
                "{merchantSays}"
              </motion.p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Item details on hover */}
        <AnimatePresence>
          {hoveredItem && (
            <motion.div
              className="fixed bottom-6 right-6 z-50"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Card className="bg-background/95 backdrop-blur border-primary/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{hoveredItem.preview}</div>
                    <div>
                      <div className="font-bold">{hoveredItem.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {hoveredItem.description}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {hoveredItem.cost.toLocaleString()} VAIN
                      </div>
                      <Badge 
                        className="mt-1 text-xs"
                        style={{ 
                          backgroundColor: `${getRarityColor(hoveredItem.rarity)}20`,
                          color: getRarityColor(hoveredItem.rarity),
                        }}
                      >
                        {hoveredItem.rarity}
                      </Badge>
                      {!hoveredItem.isAvailable && (
                        <div className="text-xs text-yellow-600 mt-1">
                          Coming Soon
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}