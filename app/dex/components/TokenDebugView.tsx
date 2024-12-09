import React from 'react';
import { useTokenContext } from "@/contexts/TokenContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const TokenDebugView = ({ address }) => {
  const context = useTokenContext();
  const token = context.tokens[address];

  // Format any value for display
  const formatValue = (value) => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  // Helper to render a key-value pair
  const DebugField = ({ label, value }) => (
    <div className="mb-2">
      <span className="font-semibold text-gray-200">{label}: </span>
      <span className="text-gray-300 break-all whitespace-pre-wrap font-mono text-sm">
        {formatValue(value)}
      </span>
    </div>
  );

  if (!token) {
    return (
      <Card className="bg-gray-800 text-white">
        <CardHeader>
          <CardTitle>Token Debug View - No Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No token data found for address: {address}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 text-white">
      <CardHeader>
        <CardTitle>Token Debug View</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-gray-700 rounded-lg">
          <h3 className="text-xl font-bold mb-4">Basic Info</h3>
          <DebugField label="Address" value={token.address} />
          <DebugField label="Name" value={token.name} />
          <DebugField label="Symbol" value={token.symbol} />
          <DebugField label="State" value={token.state} />
        </div>

        <div className="p-4 bg-gray-700 rounded-lg">
          <h3 className="text-xl font-bold mb-4">Token Economics</h3>
          <DebugField label="Initial Price" value={token.initialPrice} />
          <DebugField label="Funding Goal" value={token.fundingGoal} />
          <DebugField label="Max Supply" value={token.maxSupply} />
          <DebugField label="Price Rate" value={token.priceRate} />
        </div>

        <div className="p-4 bg-gray-700 rounded-lg">
          <h3 className="text-xl font-bold mb-4">Trading Info</h3>
          <DebugField label="Trade Cooldown" value={token.tradeCooldown} />
          <DebugField label="Max Wallet %" value={token.maxWalletPercentage} />
          <DebugField label="Last Trade" value={token.lastTrade} />
        </div>

        <div className="p-4 bg-gray-700 rounded-lg">
          <h3 className="text-xl font-bold mb-4">Stats</h3>
          <DebugField label="Stats" value={token.stats} />
        </div>

        <div className="p-4 bg-gray-700 rounded-lg">
          <h3 className="text-xl font-bold mb-4">Creation Info</h3>
          <DebugField label="Creator" value={token.creator} />
          <DebugField label="Created At" value={token.createdAt} />
          <DebugField label="Block Number" value={token.blockNumber} />
          <DebugField label="Transaction Hash" value={token.transactionHash} />
        </div>

        <div className="p-4 bg-gray-700 rounded-lg">
          <h3 className="text-xl font-bold mb-4">Other</h3>
          <DebugField label="Image URL" value={token.imageUrl} />
          <DebugField label="Description" value={token.description} />
          <DebugField label="Burn Manager" value={token.burnManager} />
          <DebugField label="Collateral" value={token.collateral} />
        </div>
      </CardContent>
    </Card>
  );
};

export default TokenDebugView;