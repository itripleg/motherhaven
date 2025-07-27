// app/factory/page.tsx - CLEAN VERSION: Zero Firestore reads, contract stats only
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/craft";
import { useToast } from "@/hooks/use-toast";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { zeroAddress, parseEther } from "viem";
import { storage, db } from "@/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore";
import { FACTORY_ADDRESS, FACTORY_ABI, FACTORY_CONSTANTS } from "@/types";
import { useFactoryConfigContext } from "@/contexts/FactoryConfigProvider";
import { useFactoryContract } from "@/final-hooks/useFactoryContract";

// Import our components
import { FactoryHeader } from "./components/FactoryHeader";
import { FactoryProgress } from "./components/FactoryProgress";
import { FactoryTabs } from "./components/FactoryTabs";
import { FactoryLaunchSection } from "./components/FactoryLaunchSection";

import { ImagePosition } from "./components/editor/types";

interface PurchaseOption {
  enabled: boolean;
  amount: string;
  minTokensOut: string;
}

interface TokenCreationInfo {
  name: string;
  ticker: string;
  image: File | null;
  imagePosition?: ImagePosition;
  description?: string;
  burnManager?: `0x${string}`;
  purchase: PurchaseOption;
}

const DEFAULT_TOKEN_INFO: TokenCreationInfo = {
  name: "",
  ticker: "",
  image: null,
  imagePosition: { x: 0, y: 0, scale: 1, rotation: 0, fit: "cover" },
  description: "",
  burnManager: undefined,
  purchase: {
    enabled: true,
    amount: "",
    minTokensOut: "0",
  },
};

export default function FactoryPage() {
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();
  const { config: factoryConfig, isLoading: configLoading } =
    useFactoryConfigContext();

  // Get contract data for platform stats - no Firestore!
  const { useAllTokens } = useFactoryContract();
  const { tokens: allTokenAddresses, isLoading: tokensLoading } =
    useAllTokens();

  // Contract-only platform statistics
  const [platformStats, setPlatformStats] = useState({
    totalTokens: 0,
    totalCollateral: "0",
    avgPrice: "0",
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
        tradingFee: factoryConfig.tradingFee / 100,
        minPurchase: parseFloat(factoryConfig.minPurchase),
        maxPurchase: parseFloat(factoryConfig.maxPurchase),
        priceRate: factoryConfig.priceRate,
        bondingCurve: "linear",
        liquidityPool: "uniswap",
      }
    : {
        fundingGoal: parseFloat(FACTORY_CONSTANTS.DEFAULT_FUNDING_GOAL),
        maxSupply: parseFloat(FACTORY_CONSTANTS.MAX_SUPPLY) / 1e18,
        initialPrice: parseFloat(FACTORY_CONSTANTS.INITIAL_PRICE),
        maxWalletPercentage: FACTORY_CONSTANTS.MAX_WALLET_PERCENTAGE,
        tradingFee: FACTORY_CONSTANTS.TRADING_FEE / 100,
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
    reset: resetContract,
  } = useWriteContract();

  const { isLoading: isConfirming, data: receipt } =
    useWaitForTransactionReceipt({
      hash: transactionData,
    });

  // Refs to prevent duplicate operations
  const toastShown = useRef(false);

  // Get platform stats from contract reads - NO FIRESTORE!
  useEffect(() => {
    if (tokensLoading) {
      setPlatformStats((prev) => ({ ...prev, loading: true }));
      return;
    }

    if (!allTokenAddresses) {
      setPlatformStats({
        totalTokens: 0,
        totalCollateral: "0",
        avgPrice: "0.00001",
        loading: false,
      });
      return;
    }

    console.log(
      "📊 Contract stats: Found",
      allTokenAddresses.length,
      "tokens from contract"
    );

    // Simple contract-based stats - ZERO Firebase reads
    setPlatformStats({
      totalTokens: allTokenAddresses.length,
      totalCollateral: "Available",
      avgPrice: "0.00001", // Initial price from contract constants
      loading: false,
    });

    console.log("✅ Platform stats loaded from contract only");
  }, [allTokenAddresses, tokensLoading]);

  // Robust state handler that preserves all fields
  const handleTokenInfoChange = useCallback(
    (updatedInfo: TokenCreationInfo | Partial<TokenCreationInfo>) => {
      console.log(
        "Factory page: handleTokenInfoChange called with:",
        updatedInfo
      );
      setTokenInfo((prevInfo) => {
        const newInfo = {
          ...prevInfo,
          ...updatedInfo,
          // Always preserve these nested objects if they exist
          purchase:
            (updatedInfo as TokenCreationInfo).purchase || prevInfo.purchase,
          imagePosition:
            (updatedInfo as TokenCreationInfo).imagePosition ||
            prevInfo.imagePosition,
        };
        console.log(
          "Factory page: State update - prev purchase:",
          prevInfo.purchase,
          "new purchase:",
          newInfo.purchase
        );
        return newInfo;
      });
    },
    []
  );

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

  // Enhanced error handling with user-friendly messages
  useEffect(() => {
    if (error) {
      console.error("Token creation error:", error);

      let errorMessage = "Failed to create token. Please try again.";
      let errorTitle = "Transaction Failed";

      const errorObj = error as any;

      if (errorObj?.cause?.reason) {
        errorMessage = errorObj.cause.reason;
        errorTitle = "Smart Contract Error";
      } else if (errorObj?.cause?.shortMessage) {
        errorMessage = errorObj.cause.shortMessage;
        errorTitle = "Transaction Error";
      } else if (errorObj?.shortMessage) {
        errorMessage = errorObj.shortMessage;
        errorTitle = "Transaction Error";
      } else if (errorObj?.message) {
        const message = errorObj.message.toLowerCase();
        if (message.includes("insufficient funds")) {
          errorTitle = "Insufficient Funds";
          errorMessage =
            "You don't have enough AVAX to complete this transaction.";
        } else if (message.includes("user rejected")) {
          errorTitle = "Transaction Rejected";
          errorMessage = "You cancelled the transaction in your wallet.";
        } else if (message.includes("gas")) {
          errorTitle = "Gas Error";
          errorMessage =
            "Transaction failed due to gas estimation issues. Please try again.";
        } else if (message.includes("nonce")) {
          errorTitle = "Network Error";
          errorMessage =
            "Transaction nonce conflict. Please wait a moment and try again.";
        } else if (message.includes("already exists")) {
          errorTitle = "Token Already Exists";
          errorMessage =
            "A token with this name or symbol already exists. Please choose different values.";
        } else {
          errorMessage = errorObj.message;
        }
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
        duration: 8000,
      });

      setIsCreating(false);
      setUploadingImage(false);
    }
  }, [error, toast]);

  // Handle successful transaction - only Firestore WRITE, no reads
  useEffect(() => {
    console.log("🎯 Receipt useEffect triggered:", {
      hasReceipt: !!receipt,
      isConfirming,
      hasTransactionData: !!transactionData,
      toastAlreadyShown: toastShown.current,
    });

    if (receipt && !isConfirming && transactionData && !toastShown.current) {
      console.log("✅ Processing successful transaction...");
      toastShown.current = true; // Prevent duplicate toasts

      // Extract token address from transaction receipt
      const tokenAddress = receipt.logs?.[0]?.address || transactionData;

      if (tokenAddress) {
        // Save complete token data to Firebase - WRITE only, no reads
        const saveTokenToFirebase = async () => {
          try {
            console.log(
              "🔥 FIRESTORE WRITE: Saving token to Firebase:",
              tokenAddress
            );
            const tokenDocRef = doc(db, "tokens", tokenAddress.toLowerCase());

            const tokenData = {
              name: tokenInfo.name,
              symbol: tokenInfo.ticker,
              imageUrl: tokenInfo.image
                ? await uploadImage(tokenInfo.image)
                : "",
              address: tokenAddress,
              creator: receipt.from,
              blockNumber: Number(receipt.blockNumber),
              transactionHash: receipt.transactionHash,
              createdAt: new Date().toISOString(),
              currentState: 1, // TRADING state
              state: 1,
              fundingGoal: tokenomics.fundingGoal.toString(),
              collateral: "0",
              virtualSupply: "0",
              lastPrice: tokenomics.initialPrice.toString(),
              description: tokenInfo.description || "",
              imagePosition: tokenInfo.imagePosition,
              burnManager: tokenInfo.burnManager || zeroAddress,
              statistics: {
                currentPrice: tokenomics.initialPrice.toString(),
                volumeETH: "0",
                tradeCount: 0,
                uniqueHolders: 0,
              },
            };

            await setDoc(tokenDocRef, tokenData);

            console.log("✅ Token data saved to Firebase successfully");

            toast({
              title: "🎉 Token Created Successfully!",
              description: "Your token is now live and ready for trading!",
              duration: 10000,
            });
          } catch (saveError) {
            console.error("❌ Error saving to Firebase:", saveError);
            toast({
              title: "Token Created",
              description:
                "Token created but failed to save metadata. The token is still functional.",
              variant: "destructive",
            });
          }
        };

        saveTokenToFirebase();
      }

      setIsCreating(false);
      setUploadingImage(false);
    } else {
      console.log("⏭️ Skipping receipt processing:", {
        hasReceipt: !!receipt,
        isConfirming,
        hasTransactionData: !!transactionData,
        toastAlreadyShown: toastShown.current,
      });
    }
  }, [receipt?.transactionHash, isConfirming, transactionData]);

  // Upload image to Firebase Storage
  const uploadImage = async (file: File): Promise<string> => {
    const storageRef = ref(storage, `token-images/${Date.now()}-${file.name}`);
    const uploadTask = await uploadBytes(storageRef, file);
    return await getDownloadURL(uploadTask.ref);
  };

  // Calculate completion percentage including purchase validation
  const getCompletionPercentage = () => {
    let completed = 0;

    // Info step (30%)
    if (tokenInfo.name && tokenInfo.ticker) {
      completed += 30;
    } else if (tokenInfo.name || tokenInfo.ticker) {
      completed += 15;
    }

    // Purchase step (25%) - valid if disabled OR enabled with amount
    const isPurchaseValid =
      !tokenInfo.purchase.enabled ||
      (tokenInfo.purchase.enabled &&
        parseFloat(tokenInfo.purchase.amount || "0") > 0);

    if (isPurchaseValid) {
      completed += 25;
    } else if (tokenInfo.purchase.enabled !== undefined) {
      completed += 12;
    }

    // Tokenomics (25% - always complete)
    completed += 25;

    // Preview (20%)
    if (tokenInfo.image) {
      completed += 20;
    }

    return Math.min(completed, 100);
  };

  // Check if form is valid for submission - memoized
  const isFormValid = useCallback(() => {
    // Basic info is required
    if (!tokenInfo.name || !tokenInfo.ticker) return false;

    // Purchase must be valid (either disabled or enabled with amount)
    const isPurchaseValid =
      !tokenInfo.purchase.enabled ||
      (tokenInfo.purchase.enabled &&
        parseFloat(tokenInfo.purchase.amount || "0") > 0);

    return isPurchaseValid;
  }, [
    tokenInfo.name,
    tokenInfo.ticker,
    tokenInfo.purchase.enabled,
    tokenInfo.purchase.amount,
  ]);

  // Handle token creation with proper image upload timing
  const handleTokenCreation = useCallback(async () => {
    if (!mounted || !isFormValid()) return;

    try {
      setIsCreating(true);
      let imageUrl = "";

      resetContract();
      toastShown.current = false; // Reset toast flag for new creation

      // Upload image if present
      if (tokenInfo.image) {
        setUploadingImage(true);
        try {
          imageUrl = await uploadImage(tokenInfo.image);
          toast({
            title: "📸 Image uploaded!",
            description: "Your token image is ready for launch",
          });
        } catch (imageError) {
          console.error("Error uploading image:", imageError);
          toast({
            title: "Upload Warning",
            description: "Failed to upload image. Proceeding without image.",
            variant: "destructive",
          });
        }
        setUploadingImage(false);
      }

      toast({
        title: "🚀 Launching Token...",
        description: "Prepare for takeoff! Your token is being created.",
      });

      // Validate inputs
      if (!tokenInfo.name.trim()) {
        throw new Error("Token name is required");
      }
      if (!tokenInfo.ticker.trim()) {
        throw new Error("Token symbol is required");
      }
      if (tokenInfo.name.length > 32) {
        throw new Error("Token name must be 32 characters or less");
      }
      if (tokenInfo.ticker.length > 8) {
        throw new Error("Token symbol must be 8 characters or less");
      }

      // Prepare transaction parameters
      const createTokenArgs = [
        tokenInfo.name.trim(),
        tokenInfo.ticker.trim().toUpperCase(),
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

      console.log(
        "Creating token with args:",
        createTokenArgs,
        "value:",
        transactionValue
      );

      // Create token on blockchain
      writeContract({
        abi: FACTORY_ABI,
        address: FACTORY_ADDRESS,
        functionName: "createToken",
        args: createTokenArgs,
        value: transactionValue,
      });
    } catch (error) {
      console.error("Error in handleTokenCreation:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      toast({
        title: "Launch Failed",
        description: errorMessage,
        variant: "destructive",
      });

      setIsCreating(false);
      setUploadingImage(false);
    }
  }, [mounted, isFormValid, tokenInfo, writeContract, resetContract, toast]);

  // Retry function
  const handleRetry = useCallback(() => {
    resetContract();
    toastShown.current = false; // Reset toast flag for retry
    handleTokenCreation();
  }, [resetContract, handleTokenCreation]);

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
            className="absolute inset-0 bg-cover bg-center opacity-100"
            style={{
              backgroundImage: `url(${backgroundImage})`,
              filter: "blur(2px)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-background/85 via-background/90 to-background/85" />
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
            <FactoryProgress
              completionPercentage={getCompletionPercentage()}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              isFormValid={isFormValid()}
              tokenInfo={{
                name: tokenInfo.name,
                ticker: tokenInfo.ticker,
                image: tokenInfo.image,
                purchase: tokenInfo.purchase,
              }}
            />
          </motion.div>

          {/* Main Content Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <FactoryTabs
              activeTab={activeTab}
              tokenInfo={tokenInfo}
              onTokenInfoChange={handleTokenInfoChange}
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
              isFormValid={isFormValid()}
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
              onRetry={handleRetry}
            />
          </motion.div>
        </Container>
      </div>
    </div>
  );
}
