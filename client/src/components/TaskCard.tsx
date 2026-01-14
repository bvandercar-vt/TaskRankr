import { useState, useRef, useEffect } from "react";
import { TaskResponse } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronRight, ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useDeleteTask } from "@/hooks/use-tasks";
import { useTaskDialog } from "@/components/TaskDialogProvider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TaskCardProps {
  task: TaskResponse;
  level?: number;
}

// Color mapping helpers
const getPriorityColor = (level: string) => {
  switch (level) {
    case 'high': return 'text-red-400 bg-red-400/10 border-red-400/20';
    case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    case 'low': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
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

export function TaskCard({ task, level = 0 }: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const deleteTask = useDeleteTask();
  const { openEditDialog } = useTaskDialog();

  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  
  const startHold = (e: React.MouseEvent | React.TouchEvent) => {
    // Prevent starting hold if clicking buttons
    if ((e.target as HTMLElement).closest('button')) return;
    
    setIsHolding(true);
    const duration = 800; // ms

    holdTimerRef.current = setTimeout(() => {
      setShowDeleteConfirm(true);
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

  const handleDelete = () => {
    deleteTask.mutate(task.id);
    setShowDeleteConfirm(false);
  };

  return (
    <div className="group relative">
      <motion.div 
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative flex items-center gap-2 p-2 rounded-lg border border-transparent transition-all duration-200 select-none cursor-pointer",
          "hover:bg-white/[0.02] hover:border-white/[0.05]",
          isHolding && "bg-white/[0.05] scale-[0.99] transition-transform"
        )}
        style={{ marginLeft: `${level * 16}px` }}
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
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate text-sm text-foreground">
              {task.name}
            </h3>
          </div>

          {/* Metadata Badges - Right Aligned Container */}
          <div className="flex items-center gap-1 shrink-0 md:w-[268px] md:justify-end pr-1.5 md:pr-0">
            <Badge variant="outline" className={cn("px-1 py-0 border text-[8px] font-bold uppercase w-16 justify-center shrink-0", getPriorityColor(task.priority))}>
              {task.priority}
            </Badge>
            <Badge variant="outline" className={cn("px-1 py-0 border text-[8px] font-bold uppercase w-16 justify-center shrink-0", getEaseColor(task.ease))}>
              {task.ease}
            </Badge>
            <Badge variant="outline" className={cn("px-1 py-0 border text-[8px] font-bold uppercase w-16 justify-center shrink-0", getEnjoymentColor(task.enjoyment))}>
              {task.enjoyment}
            </Badge>
            <Badge variant="outline" className={cn("px-1 py-0 border text-[8px] font-bold uppercase w-16 justify-center shrink-0", getTimeColor(task.time))}>
              {task.time}
            </Badge>
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
                <TaskCard key={subtask.id} task={subtask} level={level + 1} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-card border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{task.name}" and all of its subtasks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-secondary/50 border-white/5 hover:bg-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
