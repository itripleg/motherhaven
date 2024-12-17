export {};
// "use client";

// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { useState } from "react";
// import { useGlobalFinance } from "@/contexts/GlobalFinanceContext";

// export function GlobalTotalDisplay() {
//   const { globalTotal, updateGlobalTotal, loading } = useGlobalFinance();
//   const [newTotal, setNewTotal] = useState<string>("");

//   const handleUpdateTotal = () => {
//     const parsedTotal = parseFloat(newTotal);
//     if (!isNaN(parsedTotal)) {
//       updateGlobalTotal(parsedTotal);
//       setNewTotal("");
//     }
//   };

//   if (loading) {
//     return <div>Loading global total...</div>;
//   }

//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle>Global Total</CardTitle>
//       </CardHeader>
//       <CardContent>
//         <p className="text-2xl font-bold mb-4">${globalTotal.toFixed(2)}</p>
//         <div className="flex space-x-2">
//           <Input
//             type="number"
//             value={newTotal}
//             onChange={(e) => setNewTotal(e.target.value)}
//             placeholder="Enter new total"
//           />
//           <Button onClick={handleUpdateTotal}>Update Total</Button>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }
