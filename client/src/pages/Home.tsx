import { useState, useMemo } from "react";
import { useTasks } from "@/hooks/use-tasks";
import { TaskResponse, Task } from "@shared/schema";
import { TaskCard } from "@/components/TaskCard";
import { Button } from "@/components/ui/button";
import { useTaskDialog } from "@/components/TaskDialogProvider";
import { 
  Plus, Search, SlidersHorizontal, ArrowUpDown, 
  LayoutList, Network, SortAsc
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuLabel, 
  DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

type SortOption = 'none' | 'priority' | 'ease' | 'enjoyment' | 'time';

const LEVEL_WEIGHTS: Record<string, number> = {
  'high': 3,
  'hard': 3,
  'medium': 2,
  'low': 1,
  'easy': 1
};

export default function Home() {
  const { data: tasks, isLoading, error } = useTasks();
  const { openCreateDialog } = useTaskDialog();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>('none');

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
      result.sort((a, b) => {
        const valA = LEVEL_WEIGHTS[a[sort as keyof TaskResponse] as string] || 0;
        const valB = LEVEL_WEIGHTS[b[sort as keyof TaskResponse] as string] || 0;
        return valB - valA; // Descending order (High/Hard first)
      });
    }

    return result;
  };

  // Build tree from flat list if backend sends flat list
  const taskTree = useMemo(() => {
    if (!tasks) return [];
    
    const nodes: Record<number, TaskResponse> = {};
    const roots: TaskResponse[] = [];
    
    tasks.forEach(task => {
      nodes[task.id] = { ...task, subtasks: [] };
    });

    tasks.forEach(task => {
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
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <LayoutList className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold font-display tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              TaskFlow
            </h1>
          </div>
          
          <Button 
            onClick={() => openCreateDialog()} 
            className="hidden sm:flex bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Task
          </Button>
          <Button 
            onClick={() => openCreateDialog()} 
            size="icon"
            className="sm:hidden bg-primary hover:bg-primary/90 rounded-full h-10 w-10 shadow-lg"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-2 sm:px-4 py-4">
        
        {/* Controls */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search tasks..." 
              className="pl-10 bg-secondary/30 border-white/5 focus:border-primary/50 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase mr-2 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3" /> Sort By:
            </span>
            <Button
              variant={sortBy === 'priority' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy(sortBy === 'priority' ? 'none' : 'priority')}
              className="text-[10px] h-7 px-3 uppercase font-bold"
            >
              Priority
            </Button>
            <Button
              variant={sortBy === 'ease' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy(sortBy === 'ease' ? 'none' : 'ease')}
              className="text-[10px] h-7 px-3 uppercase font-bold"
            >
              Ease
            </Button>
            <Button
              variant={sortBy === 'enjoyment' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy(sortBy === 'enjoyment' ? 'none' : 'enjoyment')}
              className="text-[10px] h-7 px-3 uppercase font-bold"
            >
              Enjoyment
            </Button>
            <Button
              variant={sortBy === 'time' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy(sortBy === 'time' ? 'none' : 'time')}
              className="text-[10px] h-7 px-3 uppercase font-bold"
            >
              Time
            </Button>
            {sortBy !== 'none' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSortBy('none')}
                className="text-[10px] h-7 px-2 text-muted-foreground hover:text-foreground"
              >
                Clear
              </Button>
            )}
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
