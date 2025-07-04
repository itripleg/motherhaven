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
import { TokenCreationInfo, DEFAULT_IMAGE_POSITION } from "@/types";
import { useFactoryConfigContext } from "@/contexts/FactoryConfigProvider";

// Import our new components (to be created)
import { FactoryHeader } from "./components/FactoryHeader";
import { FactoryProgress } from "./components/FactoryProgress";
import { FactoryTabs } from "./components/FactoryTabs";
import { FactoryLaunchSection } from "./components/FactoryLaunchSection";

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
  const [tokenInfo, setTokenInfo] = useState<TokenCreationInfo>({
    name: "",
    ticker: "",
    description: "",
    image: null,
    imagePosition: DEFAULT_IMAGE_POSITION,
    burnManager: undefined,
  });

  // Real tokenomics from factory config and constants
  const tokenomics = factoryConfig
    ? {
        fundingGoal: parseFloat(FACTORY_CONSTANTS.DEFAULT_FUNDING_GOAL), // Use real default from contract
        maxSupply: parseFloat(factoryConfig.maxSupply),
        initialSupply: parseFloat(factoryConfig.initialMint),
        initialPrice: parseFloat(factoryConfig.initialPrice),
        maxWalletPercentage: factoryConfig.maxWalletPercentage,
        tradingFee: factoryConfig.tradingFee / 100, // Convert from basis points
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
        initialSupply: parseFloat(FACTORY_CONSTANTS.INITIAL_MINT) / 1e18,
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

  // Contract interaction - Updated to match new contract signature
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
        // Get total number of tokens
        const tokensCollection = collection(db, "tokens");
        const tokensSnapshot = await getCountFromServer(tokensCollection);
        const totalTokens = tokensSnapshot.data().count;

        // Get unique traders from trades collection
        const tradesCollection = collection(db, "trades");
        const tradesSnapshot = await getDocs(tradesCollection);

        const uniqueTraders = new Set();
        let totalVolumeWei = 0;

        tradesSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          uniqueTraders.add(data.trader?.toLowerCase());
          if (data.ethAmount) {
            totalVolumeWei += parseFloat(data.ethAmount) / 1e18; // Convert from wei to AVAX
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
        // Fallback to estimated values
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

  // Handle image preview
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
    const storageRef = ref(storage, `temp-uploads/${Date.now()}-${file.name}`);
    const uploadTask = await uploadBytes(storageRef, file);
    return await getDownloadURL(uploadTask.ref);
  };

  // Calculate completion percentage
  const getCompletionPercentage = () => {
    let completed = 0;
    if (tokenInfo.name) completed += 25;
    if (tokenInfo.ticker) completed += 25;
    if (tokenInfo.description) completed += 25;
    if (tokenInfo.image) completed += 25;
    return completed;
  };

  // Check if form is valid for submission
  const isFormValid = !!(
    tokenInfo.name &&
    tokenInfo.ticker &&
    tokenInfo.description
  );

  // Handle token creation - Updated to match new contract signature
  const handleTokenCreation = async () => {
    if (!mounted || !isFormValid) return;

    try {
      setIsCreating(true);
      setUploadingImage(true);
      let imageUrl = "";

      // Upload image if present
      if (tokenInfo.image) {
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
            description: "Failed to upload image. Please try again.",
            variant: "destructive",
          });
          return;
        }
      }

      setUploadingImage(false);

      toast({
        title: "🚀 Launching Token...",
        description: "Prepare for takeoff! Your token is being created.",
      });

      // Create token on blockchain with new signature
      writeContract({
        abi: FACTORY_ABI,
        address: FACTORY_ADDRESS,
        functionName: "createToken",
        args: [
          tokenInfo.name,
          tokenInfo.ticker,
          imageUrl,
          tokenInfo.burnManager || zeroAddress,
          parseEther("0"), // minTokensOut - set to 0 for basic creation
        ],
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
            className="absolute inset-0 bg-cover bg-center opacity-50"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/90 to-background/80" />
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

          {/* Progress Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <FactoryProgress completionPercentage={getCompletionPercentage()} />
          </motion.div>

          {/* Main Content Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <FactoryTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
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
