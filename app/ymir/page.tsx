export default function YmirSacrificeForm() {
  return (
    <>
      <div></div>
    </>
  );
}
// "use client";
// import React, { useState, useEffect } from "react";
// import {
//   useAccount,
//   useReadContract,
//   useWriteContract,
//   useWaitForTransactionReceipt,
// } from "wagmi";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Progress } from "@/components/ui/progress";
// import { useToast } from "@/hooks/use-toast";
// import { Loader2, Flame } from "lucide-react";
// import { formatUnits } from "viem";
// import YMIR_ABI from "./YMIR_ABI.json";
// import SHINZOU_ABI from "./SHINZOU_ABI.json";

// // Import contract addresses from your config
// // import { YMIR_ADDRESS, SHINZOU_ADDRESS } from '@/types';
// const YMIR_ADDRESS = "0x1C1443ec23978aBD3fe766c7C470A3670D88f173";
// const SHINZOU_ADDRESS = "0x984f7DE6889CFC8b06c818b1b372B89B93FEcA87";

// const TITAN_NAMES = [
//   "Attack Titan",
//   "Armored Titan",
//   "Colossal Titan",
//   "Female Titan",
//   "Beast Titan",
//   "Jaw Titan",
//   "Cart Titan",
//   "War Hammer Titan",
//   "Founding Titan",
// ];
// export function YmirSacrificeForm() {
//   const { address, isConnected } = useAccount();
//   const { toast } = useToast();
//   const [needsApproval, setNeedsApproval] = useState(true);

//   // Read tokens needed
//   const { data: tokensNeeded } = useReadContract({
//     address: YMIR_ADDRESS,
//     abi: YMIR_ABI,
//     functionName: "tokensNeededForNextTitan",
//     args: [address ?? "0x0000000000000000000000000000000000000000"],
//     // enabled: !!address,
//   });

//   // Read current allowance
//   const { data: currentAllowance } = useReadContract({
//     address: SHINZOU_ADDRESS,
//     abi: SHINZOU_ABI,
//     functionName: "allowance",
//     args: [
//       address ?? "0x0000000000000000000000000000000000000000",
//       YMIR_ADDRESS,
//     ],
//     // enabled: !!address,
//   });

//   // Write contract hooks
//   const {
//     data: approvalHash,
//     writeContract: writeApproval,
//     isPending: isApproving,
//   } = useWriteContract();

//   const {
//     data: mintHash,
//     writeContract: writeMint,
//     isPending: isMinting,
//   } = useWriteContract();

//   // Transaction receipts
//   const { isLoading: isApprovalLoading, isSuccess: isApprovalSuccess } =
//     useWaitForTransactionReceipt({
//       hash: approvalHash,
//     });

//   const { isLoading: isMintLoading, isSuccess: isMintSuccess } =
//     useWaitForTransactionReceipt({
//       hash: mintHash,
//     });

//   // Calculate progress
//   const progress = tokensNeeded
//     ? 100 - (Number(formatUnits(tokensNeeded as bigint, 18)) / 1000) * 100
//     : 0;

//   // Check if approval is needed
//   useEffect(() => {
//     if (currentAllowance) {
//       setNeedsApproval((currentAllowance as bigint) < BigInt(1000 * 10 ** 18));
//     }
//   }, [currentAllowance]);

//   // Handle approval
//   const handleApprove = async () => {
//     console.log("Approving...");
//     try {
//       writeApproval({
//         address: SHINZOU_ADDRESS,
//         abi: SHINZOU_ABI,
//         functionName: "approve",
//         args: [YMIR_ADDRESS, BigInt(1000 * 10 ** 18)],
//       });
//     } catch (err) {
//       console.error("Error approving:", err);
//       toast({
//         title: "Error",
//         description: "Failed to approve tokens. Please try again.",
//         variant: "destructive",
//       });
//     }
//   };

//   // Handle minting
//   const handleMint = async () => {
//     try {
//       writeMint({
//         address: YMIR_ADDRESS,
//         abi: YMIR_ABI,
//         functionName: "createTitan",
//       });
//     } catch (err) {
//       console.error("Error minting:", err);
//       toast({
//         title: "Error",
//         description: "Failed to mint titan. Please try again.",
//         variant: "destructive",
//       });
//     }
//   };

//   // Show success messages
//   useEffect(() => {
//     if (isApprovalSuccess) {
//       toast({
//         title: "Success!",
//         description: "Token approval successful!",
//       });
//     }
//     if (isMintSuccess) {
//       toast({
//         title: "Success!",
//         description: "Your Titan has been minted successfully!",
//       });
//     }
//   }, [isApprovalSuccess, isMintSuccess, toast]);

//   return (
//     <Card className="w-full max-w-md mx-auto">
//       <CardHeader>
//         <CardTitle className="flex items-center gap-2">
//           <Flame className="h-6 w-6 text-red-500" />
//           Titan Sacrifice Chamber
//         </CardTitle>
//         <CardDescription>
//           Sacrifice 1000 SHINZOU tokens to inherit one of the Nine Titans
//         </CardDescription>
//       </CardHeader>
//       <CardContent className="space-y-6">
//         {/* Progress Section */}
//         <div className="space-y-2">
//           <div className="flex justify-between text-sm">
//             <span>Progress to Next Titan</span>
//             <span>{Math.min(100, Math.round(progress))}%</span>
//           </div>
//           <Progress value={progress} className="h-2" />
//           <p className="text-sm text-muted-foreground">
//             {tokensNeeded
//               ? `${formatUnits(tokensNeeded as bigint, 18)} more tokens needed`
//               : "Loading..."}
//           </p>
//         </div>

//         {/* Titans Gallery */}
//         <div className="grid grid-cols-3 gap-2">
//           {TITAN_NAMES.map((name, index) => (
//             <div
//               key={name}
//               className="aspect-square rounded-lg bg-muted flex items-center justify-center p-2 text-center text-xs"
//               title={name}
//             >
//               {name.split(" ")[0]}
//             </div>
//           ))}
//         </div>

//         {/* Action Buttons */}
//         {needsApproval ? (
//           <Button
//             className="w-full"
//             size="lg"
//             disabled={!isConnected || isApproving || isApprovalLoading}
//             onClick={handleApprove}
//           >
//             {!isConnected ? (
//               "Connect Wallet"
//             ) : isApproving || isApprovalLoading ? (
//               <>
//                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                 Approving...
//               </>
//             ) : (
//               "Approve SHINZOU Tokens"
//             )}
//           </Button>
//         ) : (
//           <Button
//             className="w-full"
//             size="lg"
//             disabled={
//               !isConnected ||
//               Number(tokensNeeded) > 0 ||
//               isMinting ||
//               isMintLoading
//             }
//             onClick={handleMint}
//           >
//             {!isConnected ? (
//               "Connect Wallet"
//             ) : Number(tokensNeeded) > 0 ? (
//               "Insufficient Tokens"
//             ) : isMinting || isMintLoading ? (
//               <>
//                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                 Minting Titan...
//               </>
//             ) : (
//               "Mint Your Titan"
//             )}
//           </Button>
//         )}
//       </CardContent>
//     </Card>
//   );
// }

// export default YmirSacrificeForm;
