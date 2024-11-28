"use client";

import { useState, useEffect } from "react";
import { db, storage } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";

type TokenData = {
  name: string;
  symbol: string;
  address?: string;
  blockNumber?: number;
  timestamp?: string;
  transactionHash?: string;
};

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
import { parseEther } from "viem";
import { useToast } from "@/hooks/use-toast";
import { AddressComponent } from "@/components/AddressComponent";
import tokenFactoryMetadata from "@/contracts/token-factory/artifacts/TokenFactory_metadata.json";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import dynamic from "next/dynamic";

const FACTORY_ADDRESS = "0x7713A39875A5335dc4Fc4f9359908afb55984b1F";
const ABI = tokenFactoryMetadata.output.abi;

function Page() {
  const [tokenInfo, setTokenInfo] = useState({
    name: "",
    ticker: "",
    description: "",
    image: null as File | null,
  });

  const [tokenomics, setTokenomics] = useState({
    fundingGoal: "500",
    maxSupply: "1000000000",
    initialSupply: "200000000",
    bondingCurve: "linear",
    liquidityPool: "uniswap",
  });

  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

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

  useEffect(() => {
    if (receipt && tokenInfo.name) {
      // Find the TokenCreated event from the logs
      const tokenCreatedEvent = receipt.logs?.find((log: any) => log.address);

      if (!tokenCreatedEvent) {
        toast({
          title: "Error",
          description: "Failed to retrieve token address.",
          variant: "destructive",
        });
        return;
      }

      const address = tokenCreatedEvent.address;

      // Handle image upload to Firebase Storage and get URL
      const handleImageUpload = async () => {
        let imageUrl = "";

        if (tokenInfo.image) {
          try {
            const storageRef = ref(
              storage,
              `token-images/${address}/${tokenInfo.image.name}`
            );
            const uploadTask = await uploadBytes(storageRef, tokenInfo.image);
            imageUrl = await getDownloadURL(uploadTask.ref);
          } catch (error) {
            console.error("Error uploading image:", error);
            toast({
              title: "Warning",
              description: "Failed to upload image, but token was created.",
              variant: "destructive",
            });
          }
        }

        // Save to Firestore with image URL and creator address
        const tokenDocRef = doc(db, "tokens", address);
        await setDoc(tokenDocRef, {
          name: tokenInfo.name,
          symbol: tokenInfo.ticker,
          address,
          creator: receipt.from, // Add the creator address from the receipt
          blockNumber: Number(receipt.blockNumber),
          timestamp: new Date().toISOString(),
          transactionHash: receipt.transactionHash,
          createdAt: new Date().toISOString(),
          description: tokenInfo.description,
          imageUrl: imageUrl,
        });

        toast({
          title: "Token Created",
          description: `Token Address: ${address}`,
        });
      };

      handleImageUpload().catch((err) => {
        console.error("Error saving token details:", err);
        toast({
          title: "Error",
          description: "Failed to save token details.",
          variant: "destructive",
        });
      });
    }
  }, [receipt, toast, tokenInfo]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // TODO: Handle image upload to IPFS or other storage solution
      const imageUrl = tokenInfo.image ? "placeholder_url" : "";

      // Contract currently only accepts name and ticker
      writeContract({
        abi: ABI,
        address: FACTORY_ADDRESS,
        functionName: "createToken",
        args: [
          tokenInfo.name,
          tokenInfo.ticker,
          // parseEther(tokenomics.maxSupply),
          // parseEther(tokenomics.initialSupply),
          // tokenomics.bondingCurve === "linear" ? 0 : 1,
          // imageUrl,
          // tokenInfo.description,
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
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat "
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : "none",
      }}
    >
      <div className="min-h-screen  dark:bg-gray-900/80 ">
        <Container>
          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="token-info" className="mt-8">
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
                      Set up the economic parameters for your token
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
            <Button type="submit" className="w-full mt-4" disabled={isPending}>
              {isPending ? "Creating Token..." : "Create Token"}
            </Button>
          </form>

          {isConfirming && (
            <div className="text-center mt-4">Waiting for confirmation...</div>
          )}
          {receipt && (
            <div className="mt-4">
              <p>Transaction Receipt:</p>
              <ul>
                <li>Token Name: {tokenInfo.name}</li>
                <li>Ticker: {tokenInfo.ticker}</li>
                <li className="flex items-center">
                  Transaction:{" "}
                  <AddressComponent hash={`${transactionData}`} type="tx" />
                </li>
              </ul>
            </div>
          )}
          {error && (
            <div className="mt-4 text-red-600 text-center">
              Error: {error.message || "An error occurred"}
            </div>
          )}
        </Container>
      </div>
    </div>
  );
}

export default Page;
