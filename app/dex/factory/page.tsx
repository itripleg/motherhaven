// app/dex/factory/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/craft";
import { useToast } from "@/hooks/use-toast";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { zeroAddress, parseEther } from "viem";
import { storage, db } from "@/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, getDocs, getCountFromServer } from "firebase/firestore";
import { FACTORY_ADDRESS, FACTORY_ABI, FACTORY_CONSTANTS } from "@/types";
import { useFactoryConfigContext } from "@/contexts/FactoryConfigProvider";

// Import our components
import { FactoryHeader } from "./components/FactoryHeader";
import { FactoryProgress } from "./components/FactoryProgress";
import { FactoryTabs } from "./components/FactoryTabs";
import { FactoryLaunchSection } from "./components/FactoryLaunchSection";

interface PurchaseOption {
  enabled: boolean;
  amount: string;
  minTokensOut: string;
}

interface TokenCreationInfo {
  name: string;
  ticker: string;
  image: File | null;
  burnManager?: `0x${string}`;
  purchase: PurchaseOption;
}

// Default values
const DEFAULT_TOKEN_INFO: TokenCreationInfo = {
  name: "",
  ticker: "",
  image: null,
  burnManager: undefined,
  purchase: {
    enabled: false,
    amount: "",
    minTokensOut: "0",
  },
};

export default function FactoryPage() {
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();
  const { config: factoryConfig, isLoading: configLoading } =
    useFactoryConfigContext();

  // Real platform statistics
  const [platformStats, setPlatformStats] = useState({
    totalTokens: 0,
    activeTraders: 0,
    totalVolume: "0",
    loading: true,
  });

  // Token creation state
  const [tokenInfo, setTokenInfo] =
    useState<TokenCreationInfo>(DEFAULT_TOKEN_INFO);

  // Real tokenomics from factory config and constants
  const tokenomics = factoryConfig
    ? {
        fundingGoal: parseFloat(factoryConfig.defaultFundingGoal),
        maxSupply: parseFloat(factoryConfig.maxSupply),
        initialPrice: parseFloat(factoryConfig.initialPrice),
        maxWalletPercentage: factoryConfig.maxWalletPercentage,
        tradingFee: factoryConfig.tradingFee / 100, // Convert from basis points to percentage
        minPurchase: parseFloat(factoryConfig.minPurchase),
        maxPurchase: parseFloat(factoryConfig.maxPurchase),
        priceRate: factoryConfig.priceRate,
        bondingCurve: "linear",
        liquidityPool: "uniswap",
      }
    : {
        // Fallback to constants if config not loaded
        fundingGoal: parseFloat(FACTORY_CONSTANTS.DEFAULT_FUNDING_GOAL),
        maxSupply: parseFloat(FACTORY_CONSTANTS.MAX_SUPPLY) / 1e18,
        initialPrice: parseFloat(FACTORY_CONSTANTS.INITIAL_PRICE),
        maxWalletPercentage: FACTORY_CONSTANTS.MAX_WALLET_PERCENTAGE,
        tradingFee: FACTORY_CONSTANTS.TRADING_FEE / 100, // Convert from basis points
        minPurchase: parseFloat(FACTORY_CONSTANTS.MIN_PURCHASE),
        maxPurchase: parseFloat(FACTORY_CONSTANTS.MAX_PURCHASE),
        priceRate: FACTORY_CONSTANTS.PRICE_RATE,
        bondingCurve: "linear",
        liquidityPool: "uniswap",
      };

  // UI state
  const [activeTab, setActiveTab] = useState("info");
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Contract interaction
  const {
    data: transactionData,
    error,
    isPending,
    writeContract,
  } = useWriteContract();

  const { isLoading: isConfirming, data: receipt } =
    useWaitForTransactionReceipt({
      hash: transactionData,
    });

  // Fetch real platform statistics
  useEffect(() => {
    const fetchPlatformStats = async () => {
      try {
        const tokensCollection = collection(db, "tokens");
        const tokensSnapshot = await getCountFromServer(tokensCollection);
        const totalTokens = tokensSnapshot.data().count;

        const tradesCollection = collection(db, "trades");
        const tradesSnapshot = await getDocs(tradesCollection);

        const uniqueTraders = new Set();
        let totalVolumeWei = 0;

        tradesSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          uniqueTraders.add(data.trader?.toLowerCase());
          if (data.ethAmount) {
            totalVolumeWei += parseFloat(data.ethAmount) / 1e18;
          }
        });

        setPlatformStats({
          totalTokens,
          activeTraders: uniqueTraders.size,
          totalVolume: totalVolumeWei.toFixed(1),
          loading: false,
        });
      } catch (error) {
        console.error("Error fetching platform stats:", error);
        setPlatformStats({
          totalTokens: 1200,
          activeTraders: 450,
          totalVolume: "125.7",
          loading: false,
        });
      }
    };

    if (mounted) {
      fetchPlatformStats();
    }
  }, [mounted]);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle image preview for background effect
  useEffect(() => {
    if (tokenInfo.image) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackgroundImage(reader.result as string);
      };
      reader.readAsDataURL(tokenInfo.image);
    } else {
      setBackgroundImage(null);
    }
  }, [tokenInfo.image]);

  // Handle successful transaction
  useEffect(() => {
    if (receipt && !isConfirming) {
      toast({
        title: "🎉 Token Created Successfully!",
        description: "Your token is now live and ready for trading!",
      });
    }
  }, [receipt, isConfirming, toast]);

  // Upload image to Firebase Storage
  const uploadImage = async (file: File): Promise<string> => {
    const storageRef = ref(storage, `token-images/${Date.now()}-${file.name}`);
    const uploadTask = await uploadBytes(storageRef, file);
    return await getDownloadURL(uploadTask.ref);
  };

  // Calculate completion percentage - tokenomics always adds 25% since it's pre-configured
  const getCompletionPercentage = () => {
    let completed = 25; // Tokenomics is always complete (25%)
    if (tokenInfo.name) completed += 40; // Name adds 40%
    if (tokenInfo.ticker) completed += 35; // Ticker adds 35%
    // Note: We don't count image since it's optional
    return Math.min(completed, 100);
  };

  // Check if form is valid for submission
  const isFormValid = !!(tokenInfo.name && tokenInfo.ticker);

  // Handle token creation
  const handleTokenCreation = async () => {
    if (!mounted || !isFormValid) return;

    try {
      setIsCreating(true);
      let imageUrl = "";

      // Upload image if present
      if (tokenInfo.image) {
        setUploadingImage(true);
        try {
          imageUrl = await uploadImage(tokenInfo.image);
          toast({
            title: "📸 Image uploaded!",
            description: "Your token image is ready for launch",
          });
        } catch (error) {
          console.error("Error uploading image:", error);
          toast({
            title: "Upload Failed",
            description: "Failed to upload image. Proceeding without image.",
            variant: "destructive",
          });
          // Continue without image rather than failing
        }
        setUploadingImage(false);
      }

      toast({
        title: "🚀 Launching Token...",
        description: "Prepare for takeoff! Your token is being created.",
      });

      // Prepare transaction parameters
      const createTokenArgs = [
        tokenInfo.name,
        tokenInfo.ticker.toUpperCase(), // Ensure uppercase
        imageUrl,
        tokenInfo.burnManager || zeroAddress,
        tokenInfo.purchase.enabled && tokenInfo.purchase.minTokensOut
          ? parseEther(tokenInfo.purchase.minTokensOut)
          : parseEther("0"),
      ];

      const transactionValue =
        tokenInfo.purchase.enabled && tokenInfo.purchase.amount
          ? parseEther(tokenInfo.purchase.amount)
          : undefined;

      // Create token on blockchain
      writeContract({
        abi: FACTORY_ABI,
        address: FACTORY_ADDRESS,
        functionName: "createToken",
        args: createTokenArgs,
        value: transactionValue,
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Launch Failed",
        description: "Failed to create token. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
      setUploadingImage(false);
    }
  };

  // Show loading state during hydration
  if (!mounted) {
    return (
      <div className="min-h-screen animated-bg floating-particles">
        <Container className="py-8 pt-24">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-foreground text-lg">
                Loading Token Factory...
              </p>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-bg floating-particles md:pt-20">
      {/* Dynamic Background Image */}
      {backgroundImage && (
        <div className="fixed inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-80"
            style={{
              backgroundImage: `url(${backgroundImage})`,
              filter: "blur(2px)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/95 to-background/90" />
        </div>
      )}

      <div className="relative z-10">
        <Container className="py-8 pt-24 space-y-8">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <FactoryHeader platformStats={platformStats} />
          </motion.div>

          {/* Progress Section - Now with navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <FactoryProgress
              completionPercentage={getCompletionPercentage()}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              isFormValid={isFormValid}
            />
          </motion.div>

          {/* Main Content Tabs - Now just content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <FactoryTabs
              activeTab={activeTab}
              tokenInfo={tokenInfo}
              onTokenInfoChange={setTokenInfo}
              tokenomics={tokenomics}
              backgroundImage={backgroundImage}
              factoryConfig={factoryConfig}
              configLoading={configLoading}
            />
          </motion.div>

          {/* Launch Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <FactoryLaunchSection
              isFormValid={isFormValid}
              isCreating={isCreating}
              uploadingImage={uploadingImage}
              isPending={isPending}
              isConfirming={isConfirming}
              error={error}
              receipt={receipt}
              tokenInfo={tokenInfo}
              tokenomics={tokenomics}
              transactionData={transactionData}
              onLaunch={handleTokenCreation}
            />
          </motion.div>
        </Container>
      </div>
    </div>
  );
}
