// /app/dex/factory/page.tsx
"use client";

import { useState, useEffect } from "react";
import { storage } from "@/firebase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Container } from "@/components/craft";
import { TokenInfoForm } from "./TokenInfoForm";
import { TokenomicsForm } from "./TokenomicsForm";
import { Button } from "@/components/ui/button";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { zeroAddress } from "viem"; // Changed from ethers to viem
import { useToast } from "@/hooks/use-toast";
import { AddressComponent } from "@/components/AddressComponent";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FACTORY_ADDRESS, FACTORY_ABI } from "@/types";

// Update TokenInfo interface to include optional burnManager
interface TokenInfo {
  name: string;
  ticker: string;
  description: string;
  image: File | null;
  burnManager?: `0x${string}`;
}

function Page() {
  const [tokenInfo, setTokenInfo] = useState<TokenInfo>({
    name: "",
    ticker: "",
    description: "",
    image: null,
    burnManager: undefined,
  });

  const [tokenomics, setTokenomics] = useState({
    fundingGoal: 5,
    maxSupply: 1000000000,
    initialSupply: 200000000,
    bondingCurve: "linear",
    liquidityPool: "uniswap",
  });

  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { toast } = useToast();

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

  // Simple upload function that returns URL
  const uploadImage = async (file: File): Promise<string> => {
    const storageRef = ref(storage, `temp-uploads/${Date.now()}-${file.name}`);
    const uploadTask = await uploadBytes(storageRef, file);
    return await getDownloadURL(uploadTask.ref);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUploadingImage(true);
      let imageUrl = "";

      if (tokenInfo.image) {
        try {
          imageUrl = await uploadImage(tokenInfo.image);
        } catch (error) {
          console.error("Error uploading image:", error);
          toast({
            title: "Error",
            description: "Failed to upload image. Please try again.",
            variant: "destructive",
          });
          return;
        }
      }

      writeContract({
        abi: FACTORY_ABI,
        address: FACTORY_ADDRESS,
        functionName: "createToken",
        args: [
          tokenInfo.name,
          tokenInfo.ticker,
          imageUrl,
          tokenInfo.burnManager || zeroAddress, // Use viem's zeroAddress
        ],
      });

      toast({
        title: "Transaction Submitted",
        description: "Waiting for confirmation...",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to create token. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <Container className="">
      <div
        className="min-h-screen bg-cover bg-center bg-no-repeat md:px-28 "
        style={{
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : "none",
        }}
      >
        <div className="min-h-screen">
          <Container>
            <form onSubmit={handleSubmit}>
              <Tabs defaultValue="token-info" className="mt-8 opacity-95">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="token-info">Token Info</TabsTrigger>
                  <TabsTrigger value="tokenomics">Tokenomics</TabsTrigger>
                </TabsList>
                <TabsContent value="token-info">
                  <Card>
                    <CardHeader>
                      <CardTitle>Token Information</CardTitle>
                      <CardDescription>
                        Provide details about your new token
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <TokenInfoForm
                        tokenInfo={tokenInfo}
                        onTokenInfoChange={setTokenInfo}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="tokenomics">
                  <Card>
                    <CardHeader>
                      <CardTitle>Tokenomics</CardTitle>
                      <CardDescription>
                        Set your token&apos;s funding goal
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <TokenomicsForm
                        tokenomics={tokenomics}
                        // onTokenomicsChange={setTokenomics}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
              <div className="flex justify-center ">
                <Button
                  type="submit"
                  className="w-full mt-4 max-w-[300px] h-16 opacity-90 border-4 border-black/20"
                  disabled={isPending || uploadingImage || isConfirming}
                >
                  {uploadingImage
                    ? "Uploading Image..."
                    : isPending
                    ? "Creating Token..."
                    : isConfirming
                    ? "Confirming Transaction..."
                    : "Create Token"}
                </Button>
              </div>
            </form>
            {error && (
              <div className="mt-4 text-red-600 text-center">
                Error: {error.message || "An error occurred"}
              </div>
            )}

            {receipt && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <h3 className="font-bold text-green-800">
                  Token Created Successfully!
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Name: {tokenInfo.name}</p>
                  <p>Symbol: {tokenInfo.ticker}</p>
                  <p>Funding Goal: {tokenomics.fundingGoal} ETH</p>
                  {tokenInfo.burnManager && (
                    <p>Burn Manager: {tokenInfo.burnManager}</p>
                  )}
                  <div className="flex items-center mt-1">
                    <span>Transaction: </span>
                    <AddressComponent hash={`${transactionData}`} type="tx" />
                  </div>
                </div>
              </div>
            )}
          </Container>
        </div>
      </div>
    </Container>
  );
}

export default Page;
