"use client";

import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ProjectionProps = {
  spending: number;
  target: number;
  onUpdate: (newSpending: number, newTarget: number) => void;
};

export function Projection({ spending, target, onUpdate }: ProjectionProps) {
  const [currentSpending, setCurrentSpending] = useState(spending);
  const [targetBudget, setTargetBudget] = useState(target);

  const handleCurrentSpendingChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCurrentSpending(parseFloat(e.target.value) || 0);
  };

  const handleTargetBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTargetBudget(parseFloat(e.target.value) || 0);
  };

  const handleUpdateClick = () => {
    onUpdate(currentSpending, targetBudget);
  };

  const percentage =
    targetBudget > 0 ? (currentSpending / targetBudget) * 100 : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Spending Projection</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="currentSpending" className="text-sm font-medium">
            Current Spending
          </label>
          <Input
            id="currentSpending"
            type="number"
            value={currentSpending}
            onChange={handleCurrentSpendingChange}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="targetBudget" className="text-sm font-medium">
            Target Budget
          </label>
          <Input
            id="targetBudget"
            type="number"
            value={targetBudget}
            onChange={handleTargetBudgetChange}
          />
        </div>
        <Button onClick={handleUpdateClick}>Update Budget</Button>
        <Progress value={percentage} className="w-full" />
        <p className="text-sm">
          You&apos;ve spent ${currentSpending.toFixed(2)} of your $
          {targetBudget.toFixed(2)} budget ({percentage.toFixed(2)}%)
        </p>
        <p className="text-sm font-medium">
          {currentSpending > targetBudget
            ? "You're over budget!"
            : `You're ${
                ((targetBudget - currentSpending) / targetBudget) * 100
              }% under budget`}
        </p>
      </CardContent>
    </Card>
  );
}
