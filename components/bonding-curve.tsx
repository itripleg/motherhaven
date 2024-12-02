"use client";

import { useState } from "react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { InfoIcon } from "lucide-react";

type CurveType = "exponential" | "linear" | "logarithmic" | "flat";

export default function BondingCurve() {
  const [curveType, setCurveType] = useState<CurveType>("linear");
  const [intervals, setIntervals] = useState(6);
  const [maxSupply, setMaxSupply] = useState("1000000000");
  const [teamAllocation, setTeamAllocation] = useState("0");
  const [initialPrice, setInitialPrice] = useState("0.0001");
  const [finalPrice, setFinalPrice] = useState("0.16848261028116670");

  const generateCurveData = () => {
    const data = [];
    const max = parseInt(maxSupply);
    const initial = parseFloat(initialPrice);
    const final = parseFloat(finalPrice);

    for (let i = 0; i <= intervals; i++) {
      const supply = (max / intervals) * i;
      let price;

      switch (curveType) {
        case "exponential":
          price = initial + (final - initial) * Math.pow(i / intervals, 2);
          break;
        case "linear":
          price = initial + (final - initial) * (i / intervals);
          break;
        case "logarithmic":
          price =
            initial +
            (final - initial) * (Math.log(1 + i) / Math.log(1 + intervals));
          break;
        case "flat":
          price = initial;
          break;
      }

      data.push({
        supply: supply.toFixed(0),
        price: price.toFixed(6),
      });
    }
    return data;
  };

  return (
    <Card className="w-full hidden md:block max-w-md mx-auto ">
      <CardContent className="flex flex-col space-y-4">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium flex items-center gap-2 pt-2">
              Curve type
              <InfoIcon className="h-4 w-4 text-muted-foreground" />
            </h3>
          </div>
          <RadioGroup
            defaultValue="linear"
            onValueChange={(value) => setCurveType(value as CurveType)}
            className="flex flex-wrap gap-2"
          >
            {["exponential", "linear", "logarithmic", "flat"].map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={type}
                  id={type}
                  className="border-emerald-500 text-emerald-500"
                />
                <Label htmlFor={type} className="text-xs capitalize">
                  {type}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium flex items-center gap-2">
              Price variation intervals: {intervals}
              <InfoIcon className="h-4 w-4 text-muted-foreground" />
            </h3>
          </div>
          <Slider
            value={[intervals]}
            onValueChange={(value) => setIntervals(value[0])}
            max={20}
            step={1}
            className="w-full"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[150px]">
            <Label className="text-xs text-muted-foreground">
              Max minting supply
            </Label>
            <Input
              value={maxSupply}
              onChange={(e) => setMaxSupply(e.target.value)}
              className="text-xs"
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <Label className="text-xs text-muted-foreground">
              Team allocation
            </Label>
            <Input
              value={teamAllocation}
              onChange={(e) => setTeamAllocation(e.target.value)}
              className="text-xs"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[150px]">
            <Label className="text-xs text-muted-foreground">
              Initial minting price
            </Label>
            <div className="flex items-center gap-2">
              <Input
                value={initialPrice}
                onChange={(e) => setInitialPrice(e.target.value)}
                className="text-xs"
              />
              <span className="text-xs text-muted-foreground">SVM</span>
            </div>
          </div>
          <div className="flex-1 min-w-[150px]">
            <Label className="text-xs text-muted-foreground">
              Final minting price
            </Label>
            <div className="flex items-center gap-2">
              <Input
                value={finalPrice}
                onChange={(e) => setFinalPrice(e.target.value)}
                className="text-xs"
              />
              <span className="text-xs text-muted-foreground">SVM</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Creator allocation</span>
            <span>Public minting</span>
          </div>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={generateCurveData()}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="supply"
                  tickFormatter={(value) => {
                    const num = parseInt(value);
                    return num >= 1e6
                      ? `${(num / 1e6).toFixed(1)}M`
                      : num.toLocaleString();
                  }}
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 10 }}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => value.toFixed(4)}
                />
                <Area
                  type="stepAfter"
                  dataKey="price"
                  stroke="rgb(52, 211, 153)"
                  fill="rgba(52, 211, 153, 0.2)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
