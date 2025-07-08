// app/hooks/useTokenDescription.ts
import { useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase";
import { useToast } from "@/hooks/use-toast";

export const useTokenDescription = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const updateDescription = async (
    tokenAddress: string,
    description: string,
    userAddress: string
  ): Promise<boolean> => {
    if (!tokenAddress || !userAddress) {
      toast({
        title: "Error",
        description: "Missing required information",
        variant: "destructive",
      });
      return false;
    }

    setIsUpdating(true);
    try {
      const tokenDocRef = doc(db, "tokens", tokenAddress.toLowerCase());

      await updateDoc(tokenDocRef, {
        description: description.trim(),
        lastUpdated: serverTimestamp(),
        updatedBy: userAddress,
      });

      toast({
        title: "Success",
        description: "Token description updated successfully",
      });

      return true;
    } catch (error) {
      console.error("Error updating description:", error);
      toast({
        title: "Error",
        description: "Failed to update description. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return { updateDescription, isUpdating };
};
