import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// FIXED: Updated to use final-hooks instead of context
import { useTokenData } from "@/final-hooks/useTokenData";
import { Address } from "viem";

interface DebugTokenLoadingProps {
  tokenAddress: string;
}

export const DebugTokenLoading: React.FC<DebugTokenLoadingProps> = ({
  tokenAddress,
}) => {
  const [firebaseData, setFirebaseData] = useState<any>(null);
  const [firebaseLoading, setFirebaseLoading] = useState(false);

  // FIXED: Use final-hooks instead of context
  const {
    token: finalHooksData,
    isLoading: finalHooksLoading,
    error: finalHooksError,
    hasFirestoreData,
    hasContractData,
    refetchContract,
  } = useTokenData(tokenAddress as Address);

  const loadFirebaseData = async () => {
    setFirebaseLoading(true);
    try {
      console.log("🔍 Loading token from Firebase:", tokenAddress);
      const tokenDocRef = doc(db, "tokens", tokenAddress.toLowerCase());
      const docSnap = await getDoc(tokenDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log("📊 Raw Firebase data:", data);
        setFirebaseData(data);
      } else {
        console.log("❌ Document does not exist");
        setFirebaseData(null);
      }
    } catch (error) {
      console.error("❌ Error loading from Firebase:", error);
      setFirebaseData(null);
    } finally {
      setFirebaseLoading(false);
    }
  };

  useEffect(() => {
    if (tokenAddress) {
      loadFirebaseData();
    }
  }, [tokenAddress]);

  useEffect(() => {
    if (finalHooksData) {
      console.log("🎯 Token from final-hooks:", finalHooksData);
    }
  }, [finalHooksData]);

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              Token Loading Debug (Final-Hooks)
              <Badge variant="outline" className="bg-green-50 text-green-700">
                Final-Hooks v2.0
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={loadFirebaseData}
                size="sm"
                disabled={firebaseLoading}
              >
                {firebaseLoading ? "Loading..." : "Refresh Firebase"}
              </Button>
              <Button onClick={refetchContract} size="sm" variant="outline">
                Refresh Contract
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Data Source Status */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="p-3 bg-blue-50 rounded-lg border">
              <div className="text-sm font-medium text-blue-700">
                Direct Firebase
              </div>
              <div className="text-lg font-bold">
                {firebaseLoading
                  ? "Loading..."
                  : firebaseData
                  ? "✅ Connected"
                  : "❌ No Data"}
              </div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg border">
              <div className="text-sm font-medium text-green-700">
                Final-Hooks Firestore
              </div>
              <div className="text-lg font-bold">
                {hasFirestoreData ? "✅ Connected" : "❌ No Data"}
              </div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg border">
              <div className="text-sm font-medium text-purple-700">
                Final-Hooks Contract
              </div>
              <div className="text-lg font-bold">
                {hasContractData ? "✅ Connected" : "❌ No Data"}
              </div>
            </div>
          </div>

          {/* Firebase Data */}
          <div>
            <h3 className="font-semibold mb-2 text-blue-800 flex items-center gap-2">
              📊 Direct Firebase Data:
              {firebaseLoading && <Badge variant="secondary">Loading</Badge>}
            </h3>
            <div className="bg-white border border-gray-300 p-3 rounded text-sm text-black">
              <div>
                <strong>Has imagePosition:</strong>{" "}
                {firebaseData?.imagePosition ? "✅ YES" : "❌ NO"}
              </div>
              {firebaseData?.imagePosition && (
                <div className="mt-2">
                  <strong>Position:</strong>
                  <pre className="bg-blue-50 p-2 mt-1 rounded text-xs">
                    {JSON.stringify(firebaseData.imagePosition, null, 2)}
                  </pre>
                </div>
              )}
              <div>
                <strong>Last Updated:</strong>{" "}
                {firebaseData?.lastUpdated?.seconds
                  ? new Date(
                      firebaseData.lastUpdated.seconds * 1000
                    ).toLocaleString()
                  : firebaseData?.lastUpdated || "None"}
              </div>
              <div>
                <strong>Updated By:</strong> {firebaseData?.updatedBy || "None"}
              </div>
              <div>
                <strong>Name:</strong> {firebaseData?.name || "None"}
              </div>
              <div>
                <strong>Symbol:</strong> {firebaseData?.symbol || "None"}
              </div>
            </div>
          </div>

          {/* Final-Hooks Data */}
          <div>
            <h3 className="font-semibold mb-2 text-green-800 flex items-center gap-2">
              🎯 Final-Hooks Data:
              {finalHooksLoading && <Badge variant="secondary">Loading</Badge>}
              {finalHooksError && <Badge variant="destructive">Error</Badge>}
            </h3>
            <div className="bg-white border border-gray-300 p-3 rounded text-sm text-black">
              <div>
                <strong>Has Token:</strong>{" "}
                {finalHooksData ? "✅ YES" : "❌ NO"}
              </div>
              <div>
                <strong>Has imagePosition:</strong>{" "}
                {finalHooksData?.imagePosition ? "✅ YES" : "❌ NO"}
              </div>
              {finalHooksData?.imagePosition && (
                <div className="mt-2">
                  <strong>Position:</strong>
                  <pre className="bg-green-50 p-2 mt-1 rounded text-xs">
                    {JSON.stringify(finalHooksData.imagePosition, null, 2)}
                  </pre>
                </div>
              )}
              <div>
                <strong>Name:</strong> {finalHooksData?.name || "None"}
              </div>
              <div>
                <strong>Symbol:</strong> {finalHooksData?.symbol || "None"}
              </div>
              <div>
                <strong>Last Price:</strong> {finalHooksData?.lastPrice || "0"}{" "}
                AVAX
              </div>
              <div>
                <strong>Collateral:</strong> {finalHooksData?.collateral || "0"}{" "}
                AVAX
              </div>
              <div>
                <strong>State:</strong>{" "}
                {finalHooksData?.currentState ?? "Unknown"}
              </div>
              {finalHooksError && (
                <div>
                  <strong>Error:</strong>{" "}
                  <span className="text-red-600">{finalHooksError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Raw Data Comparison */}
          <div>
            <h3 className="font-semibold mb-2 text-gray-800">
              🔍 Raw Data Comparison:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-1 text-blue-700">
                  Direct Firebase Raw:
                </h4>
                <pre className="bg-black text-green-400 p-3 rounded text-xs overflow-auto max-h-40 border">
                  {JSON.stringify(firebaseData, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="font-medium mb-1 text-green-700">
                  Final-Hooks Raw:
                </h4>
                <pre className="bg-black text-green-400 p-3 rounded text-xs overflow-auto max-h-40 border">
                  {JSON.stringify(finalHooksData, null, 2)}
                </pre>
              </div>
            </div>
          </div>

          {/* Data Consistency Check */}
          {firebaseData && finalHooksData && (
            <div className="bg-blue-100 border-2 border-blue-400 p-4 rounded">
              <h3 className="font-bold mb-3 text-blue-800">
                🔄 Data Consistency Check:
              </h3>
              <div className="text-sm space-y-2 text-blue-900">
                <div className="flex justify-between">
                  <span>Name Match:</span>
                  <span
                    className={
                      firebaseData.name === finalHooksData.name
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {firebaseData.name === finalHooksData.name
                      ? "✅ Match"
                      : "❌ Mismatch"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Symbol Match:</span>
                  <span
                    className={
                      firebaseData.symbol === finalHooksData.symbol
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {firebaseData.symbol === finalHooksData.symbol
                      ? "✅ Match"
                      : "❌ Mismatch"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>ImagePosition Match:</span>
                  <span
                    className={
                      JSON.stringify(firebaseData.imagePosition) ===
                      JSON.stringify(finalHooksData.imagePosition)
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {JSON.stringify(firebaseData.imagePosition) ===
                    JSON.stringify(finalHooksData.imagePosition)
                      ? "✅ Match"
                      : "❌ Mismatch"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Updated Issue Detection */}
          <div className="bg-yellow-100 border-2 border-yellow-400 p-4 rounded">
            <h3 className="font-bold mb-3 text-yellow-800">
              🔧 Final-Hooks Architecture Issues:
            </h3>
            <ul className="text-sm space-y-2 text-yellow-900">
              <li className="flex items-start gap-2">
                <span className="font-bold text-red-600">•</span>
                <span>
                  <strong>
                    If Direct Firebase has data but Final-Hooks doesn't:
                  </strong>{" "}
                  The useTokenData hook isn't reading Firestore properly
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-red-600">•</span>
                <span>
                  <strong>
                    If Final-Hooks has Firestore but no Contract data:
                  </strong>{" "}
                  Contract calls are failing or address is invalid
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-red-600">•</span>
                <span>
                  <strong>If imagePosition data doesn't match:</strong> Check
                  the useTokenData hook's data mapping logic
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-green-600">•</span>
                <span>
                  <strong>Final-Hooks advantages:</strong> Real-time contract
                  data (price, collateral, state) combined with Firestore
                  metadata
                </span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
