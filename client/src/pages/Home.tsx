import { useState, useMemo } from "react";
import { useTasks } from "@/hooks/use-tasks";
import { TaskResponse } from "@shared/schema";
import { TaskCard } from "@/components/TaskCard";
import { Button } from "@/components/ui/button";
import { useTaskDialog } from "@/components/TaskDialogProvider";
import { 
  Plus, Search, Menu, CheckCircle2,
  LayoutList
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SortOption = 'none' | 'priority' | 'ease' | 'enjoyment' | 'time';

const LEVEL_WEIGHTS: Record<string, number> = {
  'high': 3,
  'hard': 3,
  'medium': 2,
  'low': 1,
  'easy': 1
};

const SORT_DIRECTIONS: Record<string, 'asc' | 'desc'> = {
  'priority': 'desc',   // high first
  'ease': 'asc',       // low (easy) first
  'enjoyment': 'desc', // high first
  'time': 'asc'        // low first
};

export default function Home() {
  const { data: tasks, isLoading, error } = useTasks();
  const { openCreateDialog } = useTaskDialog();
  const [search, setSearch] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('priority');

  // Recursive function to filter task tree
  const filterAndSortTree = (nodes: TaskResponse[], term: string, sort: SortOption): TaskResponse[] => {
    let result = nodes.reduce((acc: TaskResponse[], node) => {
      const matches = node.name.toLowerCase().includes(term.toLowerCase());
      const filteredSubtasks = node.subtasks ? filterAndSortTree(node.subtasks, term, sort) : [];
      
      if (matches || filteredSubtasks.length > 0) {
        acc.push({ ...node, subtasks: filteredSubtasks });
      }
      return acc;
    }, []);

    if (sort !== 'none') {
      const direction = SORT_DIRECTIONS[sort] || 'desc';
      result.sort((a, b) => {
        const valA = LEVEL_WEIGHTS[a[sort as keyof TaskResponse] as string] || 0;
        const valB = LEVEL_WEIGHTS[b[sort as keyof TaskResponse] as string] || 0;
        return direction === 'desc' ? valB - valA : valA - valB;
      });
    }

    return result;
  };

  // Build tree from flat list if backend sends flat list (exclude completed tasks)
  const taskTree = useMemo(() => {
    if (!tasks) return [];
    
    // Filter out completed tasks first
    const activeTasks = tasks.filter(task => !task.isCompleted);
    
    const nodes: Record<number, TaskResponse> = {};
    const roots: TaskResponse[] = [];
    
    activeTasks.forEach(task => {
      nodes[task.id] = { ...task, subtasks: [] };
    });

    activeTasks.forEach(task => {
      if (task.parentId && nodes[task.parentId]) {
        nodes[task.parentId].subtasks?.push(nodes[task.id]);
      } else {
        roots.push(nodes[task.id]);
      }
    });

    return roots;
  }, [tasks]);

  const displayedTasks = useMemo(() => {
    if (!taskTree) return [];
    return filterAndSortTree(taskTree, search, sortBy);
  }, [taskTree, search, sortBy]);

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
        {/* Controls Section */}
        <div className="flex items-center justify-between mb-4 px-2">
          {/* Hamburger Menu */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10" data-testid="button-menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-card border-white/10 w-48">
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </DropdownMenuItem>
                <Link href="/completed">
                  <DropdownMenuItem className="cursor-pointer" data-testid="menu-item-completed">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Completed Tasks
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Expandable Search */}
            {isSearchExpanded && (
              <div className="flex items-center bg-secondary/30 rounded-full border border-white/5 px-4 h-10 w-64">
                <Search className="h-4 w-4 shrink-0 text-primary" />
                <Input 
                  placeholder="Search..." 
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-full p-0 ml-3 text-sm placeholder:text-muted-foreground/50"
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onBlur={() => !search && setIsSearchExpanded(false)}
                />
              </div>
            )}
          </div>
          
          {/* Column Sort Headers Aligned with Tags */}
          <div className="flex items-center gap-1">
            <Button
              variant={sortBy === 'priority' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSortBy('priority')}
              className={cn(
                "w-16 h-8 p-0 text-[10px] font-bold uppercase tracking-wider transition-all rounded-md no-default-hover-elevate no-default-active-elevate",
                sortBy === 'priority' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              Priority
            </Button>
            <Button
              variant={sortBy === 'ease' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSortBy('ease')}
              className={cn(
                "w-16 h-8 p-0 text-[10px] font-bold uppercase tracking-wider transition-all rounded-md no-default-hover-elevate no-default-active-elevate",
                sortBy === 'ease' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              Ease
            </Button>
            <Button
              variant={sortBy === 'enjoyment' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSortBy('enjoyment')}
              className={cn(
                "w-16 h-8 p-0 text-[10px] font-bold uppercase tracking-wider transition-all rounded-md no-default-hover-elevate no-default-active-elevate",
                sortBy === 'enjoyment' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              Enjoy
            </Button>
            <Button
              variant={sortBy === 'time' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSortBy('time')}
              className={cn(
                "w-16 h-8 p-0 text-[10px] font-bold uppercase tracking-wider transition-all rounded-md no-default-hover-elevate no-default-active-elevate",
                sortBy === 'time' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              Time
            </Button>
          </div>
        </div>

        {/* Task List Area */}
        <div className="space-y-1">
          {displayedTasks.length === 0 ? (
            <EmptyState onAdd={() => openCreateDialog()} isSearch={!!search} />
          ) : (
            displayedTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))
          )}
        </div>
      </main>

      {/* Floating Action Button */}
      <Button
        onClick={() => openCreateDialog()}
        size="icon"
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-2xl bg-primary hover:bg-primary/90 text-primary-foreground z-50 transition-transform active:scale-95 border-0"
        data-testid="button-create-task"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
}

function EmptyState({ onAdd, isSearch }: { onAdd: () => void, isSearch: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
      <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-2">
        {isSearch ? <Search className="w-8 h-8 text-muted-foreground" /> : <LayoutList className="w-8 h-8 text-muted-foreground" />}
      </div>
      <h3 className="text-xl font-medium text-foreground">
        {isSearch ? "No matching tasks found" : "Your list is empty"}
      </h3>
      <p className="text-muted-foreground max-w-sm">
        {isSearch ? "Try adjusting your search terms." : "Start by adding your first task to get organized."}
      </p>
      {!isSearch && (
        <Button onClick={onAdd} variant="secondary" className="mt-4">
          Create First Task
        </Button>
      )}
    </div>
  );
}
