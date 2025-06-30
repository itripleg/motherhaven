import React, { useState } from "react";
import { doc, updateDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAccount } from "wagmi";
import { Badge } from "@/components/ui/badge";

interface FirebaseDebuggerProps {
  tokenAddress: string;
}

export const FirebaseDebugger: React.FC<FirebaseDebuggerProps> = ({
  tokenAddress,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [tokenData, setTokenData] = useState<any>(null);
  const { address: userAddress } = useAccount();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
  };

  const testFirebaseConnection = async () => {
    setIsLoading(true);
    addLog("🔄 Testing Firebase connection...");

    try {
      // Test 1: Read token document
      addLog(`📖 Reading token document: ${tokenAddress}`);
      const tokenDocRef = doc(db, "tokens", tokenAddress);
      const tokenDoc = await getDoc(tokenDocRef);

      if (tokenDoc.exists()) {
        const data = tokenDoc.data();
        setTokenData(data);
        addLog(`✅ Token document exists. Creator: ${data.creator}`);
        addLog(
          `📊 Current imagePosition: ${JSON.stringify(
            data.imagePosition || "None"
          )}`
        );

        // Check creator match
        if (userAddress && data.creator) {
          const isCreator =
            userAddress.toLowerCase() === data.creator.toLowerCase();
          addLog(`👤 User: ${userAddress}`);
          addLog(`👑 Creator: ${data.creator}`);
          addLog(`🔐 Is Creator: ${isCreator ? "✅ YES" : "❌ NO"}`);
        } else {
          addLog("⚠️ Missing user address or creator field");
        }
      } else {
        addLog("❌ Token document does not exist");
        return;
      }

      // Test 2: Try to update document
      addLog("🔄 Testing document update...");
      const testPosition = {
        x: Math.random() * 10,
        y: Math.random() * 10,
        scale: 1,
        rotation: 0,
        fit: "cover",
      };

      const updateData = {
        imagePosition: testPosition,
        lastUpdated: serverTimestamp(),
        updatedBy: userAddress,
        testUpdate: new Date().toISOString(),
      };

      await updateDoc(tokenDocRef, updateData);
      addLog("✅ Document update successful!");

      // Verify the update
      const updatedDoc = await getDoc(tokenDocRef);
      if (updatedDoc.exists()) {
        const updatedData = updatedDoc.data();
        addLog(
          `✅ Verified update: ${JSON.stringify(updatedData.imagePosition)}`
        );
      }
    } catch (error) {
      addLog(
        `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      console.error("Firebase test error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const testSpecificUpdate = async () => {
    setIsLoading(true);
    addLog("🔄 Testing specific position update...");

    try {
      const tokenDocRef = doc(db, "tokens", tokenAddress);

      // Specific update that mimics the real component
      const updateData = {
        imagePosition: {
          x: 25.5,
          y: -15.2,
          scale: 1.3,
          rotation: 5,
          fit: "cover",
        },
        lastUpdated: serverTimestamp(),
        updatedBy: userAddress,
      };

      addLog(`📤 Sending update: ${JSON.stringify(updateData.imagePosition)}`);
      await updateDoc(tokenDocRef, updateData);
      addLog("✅ Specific update successful!");
    } catch (error) {
      addLog(
        `❌ Specific update failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      console.error("Specific update error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setTokenData(null);
  };

  const checkFirebaseRules = () => {
    addLog("📋 Firebase Security Rules Check:");
    addLog("1. ✅ Read access: should be allowed for all users");
    addLog("2. ⚠️ Write access: only allowed for token creators");
    addLog("3. 🔐 Required: user must be authenticated");
    addLog(
      "4. 🎯 Required: request.auth.token.address must match resource.data.creator"
    );
    addLog("");
    addLog("If updates fail, check:");
    addLog("- Firebase Authentication is working");
    addLog("- Custom claims include wallet address");
    addLog("- Security rules allow imagePosition updates");
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Firebase Debugger
          <Badge variant="outline">Token: {tokenAddress.slice(0, 8)}...</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Control Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={testFirebaseConnection} disabled={isLoading}>
            Test Connection
          </Button>
          <Button
            onClick={testSpecificUpdate}
            disabled={isLoading}
            variant="outline"
          >
            Test Update
          </Button>
          <Button onClick={checkFirebaseRules} variant="outline">
            Check Rules
          </Button>
          <Button onClick={clearLogs} variant="destructive" size="sm">
            Clear Logs
          </Button>
        </div>

        {/* Current Token Data */}
        {tokenData && (
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-sm">Current Token Data</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs overflow-auto max-h-32 bg-white p-2 rounded border">
                {JSON.stringify(tokenData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Logs Display */}
        <Card className="bg-gray-900 text-green-400">
          <CardHeader>
            <CardTitle className="text-sm text-white">Debug Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-xs space-y-1 max-h-64 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-gray-500">
                  No logs yet. Click a test button to start.
                </div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="whitespace-pre-wrap">
                    {log}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Fixes */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-sm text-blue-800">
              Common Issues & Fixes
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div>
              <strong>❌ Permission Denied:</strong>
              <ul className="ml-4 mt-1 space-y-1 text-xs">
                <li>• Check if user wallet address matches token creator</li>
                <li>• Verify Firebase Auth is working</li>
                <li>• Check security rules allow imagePosition updates</li>
              </ul>
            </div>
            <div>
              <strong>❌ Document Not Found:</strong>
              <ul className="ml-4 mt-1 space-y-1 text-xs">
                <li>• Verify token address is correct</li>
                <li>• Check if token exists in Firestore</li>
                <li>• Ensure 'tokens' collection exists</li>
              </ul>
            </div>
            <div>
              <strong>❌ Update Failed:</strong>
              <ul className="ml-4 mt-1 space-y-1 text-xs">
                <li>• Check network connection</li>
                <li>• Verify Firestore rules</li>
                <li>• Check browser console for errors</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Firebase Rules Template */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-sm text-yellow-800">
              Firebase Security Rules Template
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-800 text-green-400 p-3 rounded overflow-auto">
              {`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tokens/{tokenId} {
      // Allow read access to everyone
      allow read: if true;
      
      // Allow create during token creation
      allow create: if request.auth != null;
      
      // Allow updates only by token creator for imagePosition
      allow update: if request.auth != null
        && request.auth.uid != null
        && resource.data.creator != null
        && request.auth.token.address.lower() == resource.data.creator.lower()
        && request.resource.data.diff(resource.data).affectedKeys()
          .hasOnly(['imagePosition', 'lastUpdated', 'updatedBy']);
    }
  }
}`}
            </pre>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};
