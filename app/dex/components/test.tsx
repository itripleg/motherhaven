  <Card className="w-full p-6">
    <CardHeader className="text-center pb-2 text-lg p-4">
      <CardTitle>
        Trade {tokenData?.symbol} ({tokenData?.name})
      </CardTitle>
    </CardHeader>
    <AddressComponent hash={tokenData?.address || ""} type="address" />

    <CardContent className="mt-4">
      {tokenData.currentState === TokenState.HALTED ? (
        <div className="text-center space-y-6">
          <div className="p-6 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <h3 className="text-xl font-semibold text-blue-500 mb-2">
              🎉 Funding Goal Reached!
            </h3>
            <p className="text-muted-foreground mb-4">
              This token has successfully reached its funding goal of{" "}
              {tokenData.fundingGoal} ETH. Trading is now moved to Uniswap.
            </p>
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm text-muted-foreground">
                You can now trade this token on Uniswap:
              </p>
              
                href="https://app.uniswap.org/#/swap" // Placeholder - will need actual pool link
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600"
              >
                <Button variant="outline" className="gap-2">
                  <span>View on Uniswap</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M7 7h10v10" />
                    <path d="M7 17 17 7" />
                  </svg>
                </Button>
              </a>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-background rounded-lg border">
              <h3 className="font-medium mb-4 text-center">Final Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Collateral Raised:</span>
                  <span className="font-medium">{tokenData.collateral} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span>Final Price:</span>
                  <span className="font-medium">{tokenData.price} ETH</span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-background rounded-lg border">
              <h3 className="font-medium mb-4 text-center">Your Holdings</h3>
              <div className="space-y-4">
                <div className="p-3 bg-secondary rounded-lg text-center">
                  <p className="text-lg font-bold">
                    {tokenFormatted.amount} {tokenData?.symbol}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ≈ ${tokenFormatted.value}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>