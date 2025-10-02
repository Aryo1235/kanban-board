import React from 'react';
import { calculateDropZoneHeight, generatePreviewText, getDropZoneStyles } from '../lib/dragDropUtils';
import { getDeadlineStatus } from '../lib/deadline';

/**
 * DropZone component - handles drag and drop zone rendering
 */
export default function DropZone({
  idx,
  active,
  draggedTask,
  onDragOver,
  onDrop,
  onDragEnter,
}) {
  const estimatedHeight = active && draggedTask 
    ? calculateDropZoneHeight(draggedTask.task)
    : 6;

  const { previewTitle, previewContent } = active && draggedTask
    ? generatePreviewText(draggedTask.task)
    : { previewTitle: '', previewContent: '' };

  const styles = getDropZoneStyles(active, estimatedHeight);

  return (
    <div
      key={`dz-${idx}`}
      onDragOver={(e) => onDragOver(e, idx)}
      onDrop={(e) => onDrop(e, idx)}
      onDragEnter={(e) => onDragEnter(e, idx)}
      className={`relative w-full select-none transition-all duration-150 ease-out ${
        draggedTask ? 'cursor-grabbing' : 'cursor-default'
      }`}
      style={styles}
    >
      {active && draggedTask && (
        <div className="absolute inset-0 flex flex-col pointer-events-none px-2 py-2 overflow-hidden">
          <div className="flex flex-col gap-1 bg-blue-500/10 border border-blue-300/60 rounded-md backdrop-blur-sm px-3 py-2 text-[11px] text-blue-100 h-full">
            <span className="uppercase tracking-wide font-semibold text-[10px] opacity-70">
              Drop Position
            </span>
            <span className="text-xs font-medium break-anywhere leading-snug">
              {previewTitle}
            </span>
            {previewContent && (
              <span className="text-[10px] text-blue-200 leading-snug whitespace-pre-line break-anywhere">
                {previewContent}
              </span>
            )}
            {draggedTask.task.deadline && (
              <span className="text-[10px] mt-1 inline-block bg-blue-400/30 px-2 py-0.5 rounded-full w-fit">
                {getDeadlineStatus(draggedTask.task.deadline)?.label}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}