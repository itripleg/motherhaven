"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function TokensCreated() {
  // This would typically fetch data from your API or blockchain
  const tokens = [
    { name: "Token A", progress: 75, goal: 1000 },
    { name: "Token B", progress: 30, goal: 500 },
    { name: "Token C", progress: 90, goal: 2000 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tokens Created</CardTitle>
        <CardDescription>Progress towards funding goals</CardDescription>
      </CardHeader>
      <CardContent>
        {tokens.map((token, index) => (
          <div key={index} className="mb-4">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">{token.name}</span>
              <span className="text-sm font-medium">{token.progress}%</span>
            </div>
            <Progress value={token.progress} className="w-full" />
            <div className="text-xs text-muted-foreground mt-1">
              Goal: {token.goal} AVAX
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
