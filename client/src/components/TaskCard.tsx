import { useState } from "react";
import { Task, TaskResponse } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, Circle, ChevronRight, ChevronDown, 
  MoreVertical, Clock, Smile, Gauge, AlertCircle, Plus 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUpdateTask } from "@/hooks/use-tasks";
import { useTaskDialog } from "./TaskDialogProvider";

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
  const updateTask = useUpdateTask();
  const { openEditDialog, openCreateDialog } = useTaskDialog();

  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  
  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateTask.mutate({ id: task.id, isCompleted: !task.isCompleted });
  };

  const handleAddSubtask = (e: React.MouseEvent) => {
    e.stopPropagation();
    openCreateDialog(task.id);
  };

  return (
    <div className="group relative">
      <motion.div 
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative flex items-center gap-3 p-4 rounded-xl border border-transparent transition-all duration-200",
          "hover:bg-white/[0.02] hover:border-white/[0.05]",
          task.isCompleted && "opacity-60 grayscale-[0.5]"
        )}
        style={{ marginLeft: `${level * 24}px` }}
        onClick={() => openEditDialog(task)}
      >
        {/* Expand/Collapse Toggle */}
        <div className="w-6 flex justify-center shrink-0">
          {hasSubtasks ? (
            <button
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </button>
          ) : (
            <div className="w-4" />
          )}
        </div>

        {/* Checkbox */}
        <button 
          onClick={handleToggleComplete}
          className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
        >
          {task.isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-primary" />
          ) : (
            <Circle className="w-5 h-5" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-5">
            <h3 className={cn(
              "font-medium truncate text-base",
              task.isCompleted ? "line-through text-muted-foreground" : "text-foreground"
            )}>
              {task.name}
            </h3>
          </div>

          {/* Metadata Badges - Desktop */}
          <div className="hidden md:flex md:col-span-7 gap-2 items-center justify-end">
            <Badge variant="outline" className={cn("gap-1.5 px-2 py-0.5 border text-[10px] font-bold uppercase tracking-wider", getPriorityColor(task.priority))}>
              <AlertCircle className="w-3 h-3" /> {task.priority}
            </Badge>

            <Badge variant="outline" className={cn("gap-1.5 px-2 py-0.5 border text-[10px] font-bold uppercase tracking-wider", getEaseColor(task.ease))}>
              <Gauge className="w-3 h-3" /> {task.ease}
            </Badge>

            <Badge variant="outline" className={cn("gap-1.5 px-2 py-0.5 border text-[10px] font-bold uppercase tracking-wider", getEnjoymentColor(task.enjoyment))}>
              <Smile className="w-3 h-3" /> {task.enjoyment}
            </Badge>

            <Badge variant="outline" className={cn("gap-1.5 px-2 py-0.5 border text-[10px] font-bold uppercase tracking-wider", getTimeColor(task.time))}>
              <Clock className="w-3 h-3" /> {task.time}
            </Badge>
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
              {/* Connector Line */}
              <div 
                className="absolute left-[34px] top-0 bottom-4 w-px bg-white/[0.05]" 
                style={{ marginLeft: `${level * 24}px` }}
              />
              {task.subtasks?.map(subtask => (
                <TaskCard key={subtask.id} task={subtask} level={level + 1} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
