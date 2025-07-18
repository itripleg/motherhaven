// app/bots/components/BotFleetTab.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, BarChart3 } from "lucide-react";
import { TVBBot, FleetStats } from "./helpers";
import BotCard from "./BotCard";

interface BotFleetTabProps {
  bots: TVBBot[];
  fleetStats: FleetStats;
}

const BotFleetTab: React.FC<BotFleetTabProps> = ({ bots, fleetStats }) => {
  if (bots.length === 0) {
    return (
      <Card className="unified-card border-border/50 bg-background/50 backdrop-blur-sm">
        <CardContent className="p-12 text-center">
          <Bot className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">
            No Bots Online
          </h3>
          <p className="text-muted-foreground mb-4">
            No TVB instances are currently running or connected.
          </p>
          {/* <p className="text-muted-foreground/70 text-sm">
            Start a bot with:{" "}
            <code className="bg-secondary px-2 py-1 rounded text-foreground">
              py .\launch_all.py --auto --verbose --auto
            </code>
          </p> */}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {bots.map((bot, index) => (
          <BotCard key={bot.name || index} bot={bot} index={index} />
        ))}
      </div>

      <Card className="unified-card border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Fleet Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-primary text-2xl font-bold">
                {fleetStats.totalActions}
              </p>
              <p className="text-primary/80 text-sm">Total Actions</p>
            </div>
            <div className="text-center p-4 bg-secondary/50 rounded-lg border border-border/30">
              <p className="text-foreground text-2xl font-bold">
                {fleetStats.activeBots}
              </p>
              <p className="text-muted-foreground text-sm">Active Bots</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg border border-border/30">
              <p className="text-foreground text-2xl font-bold">
                {fleetStats.totalBots}
              </p>
              <p className="text-muted-foreground text-sm">Total Bots</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BotFleetTab;
