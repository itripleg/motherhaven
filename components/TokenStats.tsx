import { formatDistanceToNow } from "date-fns";
import { formatEther } from "viem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TokenData, TokenState } from "@/types";

interface TokenStatsProps {
  data: TokenData;
  loading?: boolean;
}

export function TokenStats({ data, loading }: TokenStatsProps) {
  if (loading) {
    return <StatsLoading />;
  }

  // Price and Supply Metrics
  const marketCap =
    Number(data.statistics.currentPrice) * Number(data.statistics.totalSupply);

  const currentPrice = Number(data.statistics.currentPrice);
  const totalSupply = Number(data.statistics.totalSupply);

  // Funding Metrics
  const fundingGoal = Number(data.fundingGoal);
  const collateral = Number(data.collateral);
  const fundingProgress = (collateral / fundingGoal) * 100;

  // Trading Metrics
  const volumeETH = Number(data.statistics.volumeETH);
  const avgTradeValue =
    data.statistics.tradeCount > 0 ? volumeETH / data.statistics.tradeCount : 0;

  // Time Metrics
  const timeSinceCreation = formatDistanceToNow(new Date(data.createdAt), {
    addSuffix: true,
  });

  const lastTradeTime = data.statistics.lastTradeTimestamp
    ? formatDistanceToNow(new Date(data.statistics.lastTradeTimestamp), {
        addSuffix: true,
      })
    : "No trades yet";

  return (
    <div className="space-y-4">
      {/* Basic Token Info */}
      <Card>
        <CardHeader>
          <CardTitle>Token Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd>{data.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Symbol</dt>
              <dd>{data.symbol}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Creator</dt>
              <dd className="truncate font-mono text-sm">{data.creator}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">State</dt>
              <dd>{data.currentState}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd>{timeSinceCreation}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Block</dt>
              <dd>#{data.creationBlock}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Market Data */}
      <Card>
        <CardHeader>
          <CardTitle>Market Data</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Current Price
              </dt>
              <dd className="text-lg font-medium">
                {currentPrice.toFixed(6)} ETH
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Market Cap</dt>
              <dd className="text-lg font-medium">
                {marketCap.toFixed(2)} ETH
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Total Supply
              </dt>
              <dd>{totalSupply.toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Unique Holders
              </dt>
              <dd>{data.statistics.uniqueHolders}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Trading Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Trading Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Volume (ETH)
              </dt>
              <dd className="text-lg font-medium">{volumeETH.toFixed(4)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Number of Trades
              </dt>
              <dd>{data.statistics.tradeCount}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Avg Trade Value
              </dt>
              <dd>{avgTradeValue.toFixed(4)} ETH</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Trade</dt>
              <dd>{lastTradeTime}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Funding Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Funding Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Progress</dt>
              <dd>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(fundingProgress, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-sm">
                    <span>{fundingProgress.toFixed(2)}%</span>
                    <span>
                      {collateral.toFixed(2)} / {fundingGoal} ETH
                    </span>
                  </div>
                </div>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

function StatsLoading() {
  return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-[200px]" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, j) => (
                <div key={j}>
                  <Skeleton className="h-4 w-[100px] mb-2" />
                  <Skeleton className="h-6 w-[150px]" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
