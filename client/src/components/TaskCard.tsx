import { useState, useRef, useEffect } from "react";
import { TaskResponse } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronRight, ChevronDown, Trash2, X, Clock, StopCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/data-display/badge";
import { useCompleteTask, useUncompleteTask, useDeleteTask, useToggleInProgress } from "@/hooks/use-tasks";
import { useTaskDialog } from "@/components/TaskDialogProvider";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/dialogs/alert-dialog";

interface TaskCardProps {
  task: TaskResponse;
  level?: number;
  showRestore?: boolean;
  showCompletedDate?: boolean;
}

// Color mapping helpers
const getPriorityColor = (level: string) => {
  switch (level) {
    case 'highest': return 'text-red-600 bg-red-600/10 border-red-600/20';
    case 'high': return 'text-red-400 bg-red-400/10 border-red-400/20';
    case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    case 'low': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    case 'lowest': return 'text-emerald-600/60 bg-emerald-600/5 border-emerald-600/10';
    default: return 'text-slate-400';
  }
};

const getEaseColor = (level: string) => {
  switch (level) {
    case 'hard': return 'text-red-400 bg-red-400/10 border-red-400/20';
    case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    case 'easy': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    default: return 'text-slate-400';
  }
};

const getEnjoymentColor = (level: string) => {
  switch (level) {
    case 'low': return 'text-red-400 bg-red-400/10 border-red-400/20';
    case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    case 'high': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    default: return 'text-slate-400';
  }
};

const getTimeColor = (level: string) => {
  switch (level) {
    case 'high': return 'text-red-400 bg-red-400/10 border-red-400/20';
    case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    case 'low': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    default: return 'text-slate-400';
  }
};

// Format date helper
const formatCompletedDate = (dateValue: Date | string | null | undefined) => {
  if (!dateValue) return null;
  const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
};

export function TaskCard({ task, level = 0, showRestore = false, showCompletedDate = false }: TaskCardProps) {
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
    if ((e.target as HTMLElement).closest('button')) return;
    
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
          isHolding && "bg-white/[0.05] scale-[0.99] transition-transform"
        )}
        style={{ marginLeft: `${level * 16}px` }}
        data-testid={task.isInProgress ? `task-in-progress-${task.id}` : `task-${task.id}`}
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
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              className="p-0.5 hover:bg-white/10 rounded-full transition-colors"
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
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
              <Badge variant="outline" className="px-1 py-0 border text-[8px] font-bold uppercase w-16 justify-center shrink-0 text-blue-400 bg-blue-400/10 border-blue-400/20">
                In Progress
              </Badge>
            )}
          </div>

          {/* Metadata Badges - Right Aligned Container */}
          <div className="flex flex-col items-end shrink-0 md:w-[268px] pr-1.5 md:pr-0">
            <div className="flex items-center gap-1 justify-end">
              {task.priority && (
                <Badge variant="outline" className={cn("px-1 py-0 border text-[8px] font-bold uppercase w-16 justify-center shrink-0", getPriorityColor(task.priority))}>
                  {task.priority}
                </Badge>
              )}
              {task.ease && (
                <Badge variant="outline" className={cn("px-1 py-0 border text-[8px] font-bold uppercase w-16 justify-center shrink-0", getEaseColor(task.ease))}>
                  {task.ease}
                </Badge>
              )}
              {task.enjoyment && (
                <Badge variant="outline" className={cn("px-1 py-0 border text-[8px] font-bold uppercase w-16 justify-center shrink-0", getEnjoymentColor(task.enjoyment))}>
                  {task.enjoyment}
                </Badge>
              )}
              {task.time && (
                <Badge variant="outline" className={cn("px-1 py-0 border text-[8px] font-bold uppercase w-16 justify-center shrink-0", getTimeColor(task.time))}>
                  {task.time}
                </Badge>
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
              {task.subtasks?.map(subtask => (
                <TaskCard key={subtask.id} task={subtask} level={level + 1} showRestore={showRestore} showCompletedDate={showCompletedDate} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="bg-card border-white/10 pt-10">
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-2 h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setShowConfirm(false)}
            data-testid="button-close-status-dialog"
          >
            <X className="w-4 h-4" />
          </Button>
          <AlertDialogHeader>
            <AlertDialogTitle>{showRestore ? "Restore Task?" : "Task Status"}</AlertDialogTitle>
            <AlertDialogDescription>
              {showRestore 
                ? `Move "${task.name}" back to your active task list.`
                : `Choose an action for "${task.name}"`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <div className="flex flex-col gap-3 w-full">
              {!showRestore && (
                <Button
                  onClick={() => {
                    toggleInProgress.mutate({ id: task.id, isInProgress: !task.isInProgress });
                    setShowConfirm(false);
                  }}
                  variant="outline"
                  className={cn(
                    "w-full h-11 text-base font-semibold gap-2",
                    task.isInProgress 
                      ? "border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                      : "border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                  )}
                  data-testid="button-toggle-in-progress"
                >
                  {task.isInProgress ? (
                    <>
                      <StopCircle className="w-4 h-4" />
                      Remove from Progress
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4" />
                      Mark as In Progress
                    </>
                  )}
                </Button>
              )}
              
              <AlertDialogAction 
                onClick={handleAction}
                className={cn(
                  "w-full h-11 text-base font-semibold",
                  showRestore 
                    ? "bg-primary hover:bg-primary/90 text-white"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                )}
                data-testid="button-complete-task"
              >
                {showRestore ? "Restore Task" : "Complete Task"}
              </AlertDialogAction>
              
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2 h-8"
                  onClick={() => {
                    setShowConfirm(false);
                    setTimeout(() => setShowDeleteConfirm(true), 100);
                  }}
                  data-testid="button-delete-task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">Delete Permanently</span>
                </Button>
              </div>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-card border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task Permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{task.name}" and all its subtasks. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-secondary/50 border-white/5 hover:bg-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                deleteTask.mutate(task.id);
                setShowDeleteConfirm(false);
              }}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
