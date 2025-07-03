// components/ui/ColumnSelector.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Grid3X3, Grid2X2, LayoutGrid } from "lucide-react";

interface ColumnSelectorProps {
  columns: number;
  onColumnsChange: (columns: number) => void;
}

export const ColumnSelector: React.FC<ColumnSelectorProps> = ({
  columns,
  onColumnsChange,
}) => {
  const columnOptions = [
    { value: 3, label: "3", icon: Grid3X3 },
    { value: 4, label: "4", icon: Grid2X2 },
    { value: 5, label: "5", icon: LayoutGrid },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Columns:</span>
      <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1">
        {columnOptions.map(({ value, label, icon: Icon }) => (
          <Button
            key={value}
            variant={columns === value ? "default" : "ghost"}
            size="sm"
            onClick={() => onColumnsChange(value)}
            className={`
              h-8 w-8 p-0 transition-all duration-200
              ${
                columns === value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-muted/50"
              }
            `}
          >
            <Icon className="h-3 w-3" />
            <span className="sr-only">{label} columns</span>
          </Button>
        ))}
      </div>
      <Badge variant="outline" className="text-xs">
        {columns}
      </Badge>
    </div>
  );
};
