"use client";
import React, { useEffect, useRef, memo } from "react";

interface TradingViewWidgetProps {
  height?: number;
}

function TradingViewWidget({ height = 350 }: TradingViewWidgetProps) {
  const container = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = `
      {
        "symbols": [
          [
            "AVAX",
            "BINANCE:AVAXUSDT|1D"
          ]
        ],
        "chartOnly": false,
        "width": "100%",
        "height": "${height}",
        "locale": "en",
        "colorTheme": "dark",
        "autosize": false,
        "showVolume": false,
        "showMA": false,
        "hideDateRanges": false,
        "hideMarketStatus": false,
        "hideSymbolLogo": false,
        "scalePosition": "right",
        "scaleMode": "Normal",
        "fontFamily": "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
        "fontSize": "10",
        "noTimeScale": false,
        "valuesTracking": "1",
        "changeMode": "price-and-percent",
        "chartType": "bars",
        "dateRanges": [
          "1d|5",
          "1d|15",
          "1d|30",
          "1d|60"
        ]
      }`;

    if (container.current) {
      container.current.appendChild(script);
    }

    return () => {
      if (container.current && script.parentNode) {
        container.current.removeChild(script);
      }
    };
  }, [height]);

  return (
    <div className="w-full">
      <div className="mb-3 px-2">
        <h3 className="text-lg font-bold text-foreground">AVAX Price</h3>
        <p className="text-sm text-muted-foreground">Market reference</p>
      </div>

      <div
        className="w-full border border-border rounded-lg overflow-hidden"
        style={{ height: `${height}px` }}
      >
        <div ref={container} className="w-full h-full" />
      </div>

      <div className="mt-2 text-xs text-muted-foreground text-center">
        Powered by TradingView
      </div>
    </div>
  );
}

export default memo(TradingViewWidget);
