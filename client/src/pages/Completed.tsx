import { useMemo } from "react";
import { useTasks } from "@/hooks/use-tasks";
import { TaskResponse } from "@shared/schema";
import { TaskCard } from "@/components/TaskCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";

export default function Completed() {
  const { data: tasks, isLoading, error } = useTasks();

  // Build tree from flat list for completed tasks only
  const completedTasks = useMemo(() => {
    if (!tasks) return [];
    
    // Filter to completed tasks first
    const completedOnly = tasks.filter(task => task.isCompleted);
    
    const nodes: Record<number, TaskResponse> = {};
    const roots: TaskResponse[] = [];
    
    completedOnly.forEach(task => {
      nodes[task.id] = { ...task, subtasks: [] };
    });

    completedOnly.forEach(task => {
      if (task.parentId && nodes[task.parentId]) {
        nodes[task.parentId].subtasks?.push(nodes[task.id]);
      } else {
        roots.push(nodes[task.id]);
      }
    });

    return roots;
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-12 h-12 rounded-full bg-secondary/50"></div>
          <div className="h-4 w-32 bg-secondary/50 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-destructive">
        Error loading tasks. Please try again.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-32">
      <main className="max-w-5xl mx-auto px-2 sm:px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 px-2">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-10 w-10" data-testid="button-back-home">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Completed Tasks</h1>
        </div>

        {/* Task List Area */}
        <div className="space-y-1">
          {completedTasks.length === 0 ? (
            <EmptyState />
          ) : (
            completedTasks.map(task => (
              <TaskCard key={task.id} task={task as TaskResponse} showRestore />
            ))
          )}
        </div>
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
      <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-2">
        <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-medium text-foreground">
        No completed tasks yet
      </h3>
      <p className="text-muted-foreground max-w-sm">
        Long-press on any task to mark it as complete.
      </p>
    </div>
  );
}
