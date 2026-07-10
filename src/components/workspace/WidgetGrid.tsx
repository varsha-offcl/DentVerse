import * as React from "react";
import type { WidgetId, WidgetLayoutItem, WidgetSpan } from "@/data/widgets";

interface DragState {
  editMode: boolean;
  isDragging: boolean;
  isDropTarget: boolean;
  cardDragProps: React.HTMLAttributes<HTMLDivElement>;
}

interface WidgetGridProps {
  layout: WidgetLayoutItem[];
  editMode: boolean;
  onReorder: (next: WidgetLayoutItem[]) => void;
  renderWidget: (id: WidgetId, span: WidgetSpan, dragState: DragState) => React.ReactNode;
}

export default function WidgetGrid({ layout, editMode, onReorder, renderWidget }: WidgetGridProps) {
  const [draggedId, setDraggedId] = React.useState<WidgetId | null>(null);
  const [overId, setOverId] = React.useState<WidgetId | null>(null);

  const handleDrop = (targetId: WidgetId) => {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setOverId(null);
      return;
    }
    const next = [...layout];
    const fromIdx = next.findIndex((w) => w.id === draggedId);
    const toIdx = next.findIndex((w) => w.id === targetId);
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    onReorder(next);
    setDraggedId(null);
    setOverId(null);
  };

  return (
    <div className="columns-1 gap-4 lg:columns-2">
      {layout.map(({ id, span }) => {
        const cardDragProps: React.HTMLAttributes<HTMLDivElement> & { "data-widget-id"?: string } = editMode
          ? {
              "data-widget-id": id,
              draggable: true,
              onDragStart: () => setDraggedId(id),
              onDragOver: (e) => {
                e.preventDefault();
                if (overId !== id) setOverId(id);
              },
              onDragLeave: () => setOverId((prev) => (prev === id ? null : prev)),
              onDrop: (e) => {
                e.preventDefault();
                handleDrop(id);
              },
              onDragEnd: () => {
                setDraggedId(null);
                setOverId(null);
              },
            }
          : { "data-widget-id": id };

        return (
          <React.Fragment key={id}>
            {renderWidget(id, span, {
              editMode,
              isDragging: draggedId === id,
              isDropTarget: editMode && overId === id && draggedId !== id,
              cardDragProps,
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
}
