import { useState, useRef, useEffect } from "react";
import type { TaskResponse } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/primitives/badge";
import {
  useCompleteTask,
  useUncompleteTask,
  useDeleteTask,
  useToggleInProgress,
} from "@/hooks/use-tasks";
import { useTaskDialog } from "@/components/TaskDialogProvider";
import { getAttributeStyle } from "@/lib/taskStyles";
import { ChangeStatusDialog } from "@/components/ChangeStatusDialog";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";

interface TaskBadgeProps {
  value: string;
  styleClass: string;
}

function TaskBadge({ value, styleClass }: TaskBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "px-1 py-0 border text-[8px] font-bold uppercase w-16 justify-center shrink-0",
        styleClass,
      )}
      data-testid={`badge-${value}`}
    >
      {value}
    </Badge>
  );
}

interface TaskCardProps {
  task: TaskResponse;
  level?: number;
  showRestore?: boolean;
  showCompletedDate?: boolean;
}

// Format date helper
const formatCompletedDate = (dateValue: Date | string | null | undefined) => {
  if (!dateValue) return null;
  const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export function TaskCard({
  task,
  level = 0,
  showRestore = false,
  showCompletedDate = false,
}: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);

  const completeTask = useCompleteTask();
  const uncompleteTask = useUncompleteTask();
  const deleteTask = useDeleteTask();
  const toggleInProgress = useToggleInProgress();
  const { openEditDialog } = useTaskDialog();

  const hasSubtasks = task.subtasks && task.subtasks.length > 0;

  const startHold = (e: React.MouseEvent | React.TouchEvent) => {
    // Prevent starting hold if clicking buttons
    if ((e.target as HTMLElement).closest("button")) return;

    setIsHolding(true);
    const duration = 800; // ms

    holdTimerRef.current = setTimeout(() => {
      setShowConfirm(true);
      setIsHolding(false);
    }, duration);
  };

  const cancelHold = () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    setIsHolding(false);
  };

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    };
  }, []);

  const handleAction = () => {
    if (showRestore) {
      uncompleteTask.mutate(task.id);
    } else {
      completeTask.mutate(task.id);
    }
    setShowConfirm(false);
  };

  return (
    <div className="group relative">
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative flex items-center gap-2 p-2 rounded-lg border transition-all duration-200 select-none cursor-pointer",
          task.isInProgress
            ? "border-blue-500/30 bg-blue-500/5"
            : "border-transparent hover:bg-white/[0.02] hover:border-white/[0.05]",
          isHolding && "bg-white/[0.05] scale-[0.99] transition-transform",
        )}
        style={{ marginLeft: `${level * 16}px` }}
        data-testid={
          task.isInProgress ? `task-in-progress-${task.id}` : `task-${task.id}`
        }
        onClick={() => openEditDialog(task)}
        onMouseDown={startHold}
        onMouseUp={cancelHold}
        onMouseLeave={cancelHold}
        onTouchStart={startHold}
        onTouchEnd={cancelHold}
      >
        {/* Expand/Collapse Toggle */}
        <div className="w-5 flex justify-center shrink-0">
          {hasSubtasks ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-0.5 hover:bg-white/10 rounded-full transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </button>
          ) : (
            <div className="w-3.5" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-1 md:gap-4">
          <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
            <h3 className="font-semibold truncate text-base text-foreground">
              {task.name}
            </h3>
            {task.isInProgress && (
              <TaskBadge
                value="In Progress"
                styleClass="text-blue-400 bg-blue-400/10 border-blue-400/20"
              />
            )}
          </div>

          {/* Metadata Badges - Right Aligned Container */}
          <div className="flex flex-col items-end shrink-0 md:w-[268px] pr-1.5 md:pr-0">
            <div className="flex items-center gap-1 justify-end">
              {task.priority && (
                <TaskBadge value={task.priority} styleClass={getAttributeStyle("priority", task.priority)} />
              )}
              {task.ease && (
                <TaskBadge value={task.ease} styleClass={getAttributeStyle("ease", task.ease)} />
              )}
              {task.enjoyment && (
                <TaskBadge value={task.enjoyment} styleClass={getAttributeStyle("enjoyment", task.enjoyment)} />
              )}
              {task.time && (
                <TaskBadge value={task.time} styleClass={getAttributeStyle("time", task.time)} />
              )}
            </div>
            {showCompletedDate && task.completedAt && (
              <span className="text-[10px] text-muted-foreground mt-0.5">
                Completed: {formatCompletedDate(task.completedAt)}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Subtasks */}
      <AnimatePresence>
        {isExpanded && hasSubtasks && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="relative">
              <div
                className="absolute left-[26px] top-0 bottom-3 w-px bg-white/[0.05]"
                style={{ marginLeft: `${level * 16}px` }}
              />
              {task.subtasks?.map((subtask) => (
                <TaskCard
                  key={subtask.id}
                  task={subtask}
                  level={level + 1}
                  showRestore={showRestore}
                  showCompletedDate={showCompletedDate}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ChangeStatusDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        taskName={task.name}
        isInProgress={task.isInProgress}
        showRestore={showRestore}
        onToggleInProgress={() => {
          toggleInProgress.mutate({
            id: task.id,
            isInProgress: !task.isInProgress,
          });
          setShowConfirm(false);
        }}
        onComplete={handleAction}
        onDeleteClick={() => {
          setShowConfirm(false);
          setTimeout(() => setShowDeleteConfirm(true), 100);
        }}
      />

      <ConfirmDeleteDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        taskName={task.name}
        onConfirm={() => {
          deleteTask.mutate(task.id);
          setShowDeleteConfirm(false);
        }}
      />
    </div>
  );
}
