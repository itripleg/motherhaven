export {};
// import { useEffect, useState } from "react";
// import { useAccount, useBalance } from "wagmi";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { formatEther } from "viem";
// import {
//   collection,
//   query,
//   where,
//   getDocs,
//   doc,
//   setDoc,
//   onSnapshot,
// } from "firebase/firestore";
// import { db } from "@/firebase";

// export function BalanceOverview() {
//   const { address, isConnected } = useAccount();
//   const [totalValue, setTotalValue] = useState("0");
//   const [loading, setLoading] = useState(true);

//   // Get ETH balance
//   const { data: ethBalance } = useBalance({
//     address: address,
//   });

//   // Listen for user's balance updates in Firestore
//   useEffect(() => {
//     if (!address) return;

//     const userRef = doc(db, "userBalances", address.toLowerCase());

//     // Create or update user balance document
//     const initializeUser = async () => {
//       try {
//         const ethValue = ethBalance ? formatEther(ethBalance.value) : "0";
//         await setDoc(
//           userRef,
//           {
//             address: address.toLowerCase(),
//             ethBalance: ethValue,
//             lastUpdated: new Date().toISOString(),
//           },
//           { merge: true }
//         );
//       } catch (error) {
//         console.error("Error initializing user balance:", error);
//       }
//     };

//     initializeUser();

//     // Listen for balance updates
//     const unsubscribe = onSnapshot(userRef, (doc) => {
//       if (doc.exists()) {
//         const data = doc.data();
//         setTotalValue(data.ethBalance || "0");
//         setLoading(false);
//       }
//     });

//     return () => unsubscribe();
//   }, [address, ethBalance]);

//   // Fetch all token balances
//   useEffect(() => {
//     const fetchTokenBalances = async () => {
//       if (!address) return;

//       try {
//         const tokensRef = collection(db, "tokens");
//         const q = query(
//           tokensRef,
//           where("holders", "array-contains", address.toLowerCase())
//         );

//         const querySnapshot = await getDocs(q);
//         let totalTokenValue = 0;

//         querySnapshot.docs.forEach((doc) => {
//           const data = doc.data();
//           if (data.currentPrice && data.balance) {
//             totalTokenValue +=
//               parseFloat(data.currentPrice) * parseFloat(data.balance);
//           }
//         });

//         // Update total value in Firestore
//         const userRef = doc(db, "userBalances", address.toLowerCase());
//         const ethValue = ethBalance
//           ? parseFloat(formatEther(ethBalance.value))
//           : 0;

//         await setDoc(
//           userRef,
//           {
//             tokenValue: totalTokenValue.toString(),
//             totalValue: (totalTokenValue + ethValue).toString(),
//             lastUpdated: new Date().toISOString(),
//           },
//           { merge: true }
//         );
//       } catch (error) {
//         console.error("Error fetching token balances:", error);
//       }
//     };

//     fetchTokenBalances();
//   }, [address, ethBalance]);

//   if (!isConnected) {
//     return (
//       <Card>
//         <CardHeader>
//           <CardTitle>Balance Overview</CardTitle>
//           <CardDescription>Connect your wallet to view balance</CardDescription>
//         </CardHeader>
//       </Card>
//     );
//   }

//   if (loading) {
//     return (
//       <Card>
//         <CardHeader>
//           <CardTitle>Balance Overview</CardTitle>
//           <CardDescription>Loading balance data...</CardDescription>
//         </CardHeader>
//       </Card>
//     );
//   }

//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle>Balance Overview</CardTitle>
//         <CardDescription>Your total portfolio value</CardDescription>
//       </CardHeader>
//       <CardContent>
//         <div className="grid gap-4">
//           <div className="flex flex-col space-y-2">
//             <p className="text-sm text-muted-foreground">Total Value</p>
//             <p className="text-2xl font-bold">
//               {parseFloat(totalValue).toFixed(4)} ETH
//             </p>
//           </div>
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <p className="text-sm text-muted-foreground">ETH Balance</p>
//               <p className="text-xl font-semibold">
//                 {ethBalance
//                   ? parseFloat(formatEther(ethBalance.value)).toFixed(4)
//                   : "0"}{" "}
//                 ETH
//               </p>
//             </div>
//             <div>
//               <p className="text-sm text-muted-foreground">Token Value</p>
//               <p className="text-xl font-semibold">
//                 {(
//                   parseFloat(totalValue) -
//                   (ethBalance ? parseFloat(formatEther(ethBalance.value)) : 0)
//                 ).toFixed(4)}{" "}
//                 ETH
//               </p>
//             </div>
//           </div>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

// export default BalanceOverview;
