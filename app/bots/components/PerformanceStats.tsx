import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, Calendar, Zap, Timer } from "lucide-react";
import { BotStatus } from "./detailHelpers";

interface PerformanceStatsProps {
  bot: BotStatus;
}

const PerformanceStats: React.FC<PerformanceStatsProps> = ({ bot }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
    <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
      <CardContent className="p-6 text-center">
        <Activity className="h-6 w-6 text-blue-400 mx-auto mb-2" />
        <p className="text-2xl font-bold text-white">{bot.totalActions}</p>
        <p className="text-sm text-gray-400">Total Actions</p>
      </CardContent>
    </Card>

    <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
      <CardContent className="p-6 text-center">
        <Calendar className="h-6 w-6 text-purple-400 mx-auto mb-2" />
        <p className="text-lg font-bold text-white">
          {new Date(bot.sessionStarted).toLocaleDateString()}
        </p>
        <p className="text-sm text-gray-400">Session Started</p>
      </CardContent>
    </Card>

    <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
      <CardContent className="p-6 text-center">
        <Zap className="h-6 w-6 text-orange-400 mx-auto mb-2" />
        <p className="text-2xl font-bold text-white capitalize">
          {bot.lastAction?.type.replace("_", " ") || "None"}
        </p>
        <p className="text-sm text-gray-400">Last Action</p>
      </CardContent>
    </Card>

    <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
      <CardContent className="p-6 text-center">
        <Timer className="h-6 w-6 text-green-400 mx-auto mb-2" />
        <p className="text-lg font-bold text-white">
          {bot.config
            ? `${bot.config.minInterval}-${bot.config.maxInterval}s`
            : "N/A"}
        </p>
        <p className="text-sm text-gray-400">Trade Interval</p>
      </CardContent>
    </Card>
  </div>
);

export default PerformanceStats;
