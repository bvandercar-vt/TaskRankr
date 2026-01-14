import { useState, useRef, useEffect } from "react";
import { TaskResponse } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronRight, ChevronDown, Plus 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDeleteTask } from "@/hooks/use-tasks";
import { useTaskDialog } from "./TaskDialogProvider";
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
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const deleteTask = useDeleteTask();
  const { openEditDialog, openCreateDialog } = useTaskDialog();

  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  
  const handleAddSubtask = (e: React.MouseEvent) => {
    e.stopPropagation();
    openCreateDialog(task.id);
  };

  const startHold = (e: React.MouseEvent | React.TouchEvent) => {
    // Prevent starting hold if clicking buttons
    if ((e.target as HTMLElement).closest('button')) return;
    
    setHoldProgress(0);
    const startTime = Date.now();
    const duration = 800; // ms

    holdTimerRef.current = setTimeout(() => {
      setShowDeleteConfirm(true);
      setHoldProgress(0);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    }, duration);

    progressTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setHoldProgress(Math.min((elapsed / duration) * 100, 100));
    }, 16);
  };

  const cancelHold = () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    setHoldProgress(0);
  };

  useEffect(() => {
    return () => cancelHold();
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
          holdProgress > 0 && "bg-white/[0.05]"
        )}
        style={{ marginLeft: `${level * 16}px` }}
        onClick={() => openEditDialog(task)}
        onMouseDown={startHold}
        onMouseUp={cancelHold}
        onMouseLeave={cancelHold}
        onTouchStart={startHold}
        onTouchEnd={cancelHold}
      >
        {/* Hold Progress Bar */}
        {holdProgress > 0 && (
          <div 
            className="absolute left-0 bottom-0 h-0.5 bg-primary/50 transition-all duration-75"
            style={{ width: `${holdProgress}%` }}
          />
        )}

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
        <div className="flex-1 min-w-0 flex flex-col md:grid md:grid-cols-12 gap-1 md:gap-4 items-start md:items-center">
          <div className="md:col-span-5 w-full">
            <h3 className="font-medium truncate text-sm text-foreground">
              {task.name}
            </h3>
          </div>

          {/* Metadata Badges - Mobile/Tree View */}
          <div className="flex flex-wrap md:hidden gap-1 mt-0.5">
            <div className="flex items-center gap-0.5">
              <span className="text-[7px] text-muted-foreground uppercase font-bold w-12 text-right">Priority:</span>
              <Badge variant="outline" className={cn("px-1 py-0 border text-[8px] font-bold uppercase w-16 justify-center", getPriorityColor(task.priority))}>
                {task.priority}
              </Badge>
            </div>
            <div className="flex items-center gap-0.5">
              <span className="text-[7px] text-muted-foreground uppercase font-bold w-12 text-right">Ease:</span>
              <Badge variant="outline" className={cn("px-1 py-0 border text-[8px] font-bold uppercase w-16 justify-center", getEaseColor(task.ease))}>
                {task.ease}
              </Badge>
            </div>
            <div className="flex items-center gap-0.5">
              <span className="text-[7px] text-muted-foreground uppercase font-bold w-12 text-right">Enjoyment:</span>
              <Badge variant="outline" className={cn("px-1 py-0 border text-[8px] font-bold uppercase w-16 justify-center", getEnjoymentColor(task.enjoyment))}>
                {task.enjoyment}
              </Badge>
            </div>
            <div className="flex items-center gap-0.5">
              <span className="text-[7px] text-muted-foreground uppercase font-bold w-12 text-right">Time:</span>
              <Badge variant="outline" className={cn("px-1 py-0 border text-[8px] font-bold uppercase w-16 justify-center", getTimeColor(task.time))}>
                {task.time}
              </Badge>
            </div>
          </div>

          {/* Metadata Badges - Desktop */}
          <div className="hidden md:flex md:col-span-7 gap-3 items-center justify-end">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-muted-foreground uppercase font-bold w-16 text-right">Priority:</span>
              <Badge variant="outline" className={cn("px-2 py-0.5 border text-[10px] font-bold uppercase tracking-wider w-20 justify-center", getPriorityColor(task.priority))}>
                {task.priority}
              </Badge>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-muted-foreground uppercase font-bold w-16 text-right">Ease:</span>
              <Badge variant="outline" className={cn("px-2 py-0.5 border text-[10px] font-bold uppercase tracking-wider w-20 justify-center", getEaseColor(task.ease))}>
                {task.ease}
              </Badge>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-muted-foreground uppercase font-bold w-16 text-right">Enjoyment:</span>
              <Badge variant="outline" className={cn("px-2 py-0.5 border text-[10px] font-bold uppercase tracking-wider w-20 justify-center", getEnjoymentColor(task.enjoyment))}>
                {task.enjoyment}
              </Badge>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-muted-foreground uppercase font-bold w-16 text-right">Time:</span>
              <Badge variant="outline" className={cn("px-2 py-0.5 border text-[10px] font-bold uppercase tracking-wider w-20 justify-center", getTimeColor(task.time))}>
                {task.time}
              </Badge>
            </div>
          </div>
        </div>

        {/* Hover Actions */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full hover:bg-white/10"
            onClick={handleAddSubtask}
            title="Add subtask"
          >
            <Plus className="w-4 h-4" />
          </Button>
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
