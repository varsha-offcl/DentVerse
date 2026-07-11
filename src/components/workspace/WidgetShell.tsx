import * as React from "react";
import { GripVertical, Minimize2, Maximize2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { WidgetSpan } from "@/data/widgets";

interface WidgetShellProps {
  title: string;
  icon?: React.ReactNode;
  span?: WidgetSpan;
  editMode?: boolean;
  headerAction?: React.ReactNode;
  isDragging?: boolean;
  isDropTarget?: boolean;
  cardDragProps?: React.HTMLAttributes<HTMLDivElement>;
  onToggleSpan?: () => void;
  children: React.ReactNode;
}

export default function WidgetShell({
  title,
  icon,
  span = 1,
  editMode = false,
  headerAction,
  isDragging = false,
  isDropTarget = false,
  cardDragProps,
  onToggleSpan,
  children,
}: WidgetShellProps) {
  return (
    <Card
      {...cardDragProps}
      style={{ columnSpan: span === 2 ? ("all" as const) : undefined }}
      className={cn(
        "mb-4 flex flex-col overflow-hidden break-inside-avoid transition-all",
        editMode && "cursor-grab border-dashed border-primary/40 active:cursor-grabbing",
        isDragging && "opacity-40",
        isDropTarget && "ring-2 ring-primary"
      )}
    >
      <CardHeader className="flex-row h-12 items-center justify-between space-y-0 bg-primary py-0 text-white">
        <div className="flex items-center gap-2">
          {editMode && <GripVertical className="h-4 w-4 text-white/80" />}
          {icon}
          <CardTitle className="text-sm text-white">{title}</CardTitle>
        </div>
        {editMode ? (
          onToggleSpan && (
            <button
              type="button"
              onClick={onToggleSpan}
              className="flex items-center gap-1 rounded-md border border-white/40 px-2 py-1 text-[11px] font-medium text-white hover:bg-white/10"
              title={span === 2 ? "Shrink to half width" : "Expand to full width"}
            >
              {span === 2 ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
              {span === 2 ? "Full width" : "Half width"}
            </button>
          )
        ) : (
          headerAction
        )}
      </CardHeader>
      <CardContent className="flex-1 pt-4">{children}</CardContent>
    </Card>
  );
}
