import { useState, useMemo } from "react";
import { useTasks } from "@/hooks/use-tasks";
import { TaskResponse } from "@shared/schema";
import { TaskCard } from "@/components/TaskCard";
import { Button } from "@/components/ui/button";
import { useTaskDialog } from "@/components/TaskDialogProvider";
import { 
  Plus, Search, ArrowUpDown, 
  LayoutList
} from "lucide-react";
import { Input } from "@/components/ui/input";

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
      const direction = SORT_DIRECTIONS[sort] || 'desc';
      result.sort((a, b) => {
        const valA = LEVEL_WEIGHTS[a[sort as keyof TaskResponse] as string] || 0;
        const valB = LEVEL_WEIGHTS[b[sort as keyof TaskResponse] as string] || 0;
        return direction === 'desc' ? valB - valA : valA - valB;
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
    <div className="min-h-screen bg-background text-foreground pb-32">
      <main className="max-w-5xl mx-auto px-2 sm:px-4 py-8">
        {/* Search and Sort Section */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search tasks..." 
              className="pl-10 bg-secondary/30 border-white/5 focus:border-primary/50 transition-all h-12"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase mr-2 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3" /> Sort:
            </span>
            <Button
              variant={sortBy === 'priority' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy(sortBy === 'priority' ? 'none' : 'priority')}
              className="text-[10px] h-9 px-4 uppercase font-bold tracking-wider"
            >
              Priority
            </Button>
            <Button
              variant={sortBy === 'ease' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy(sortBy === 'ease' ? 'none' : 'ease')}
              className="text-[10px] h-9 px-4 uppercase font-bold tracking-wider"
            >
              Ease
            </Button>
            <Button
              variant={sortBy === 'enjoyment' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy(sortBy === 'enjoyment' ? 'none' : 'enjoyment')}
              className="text-[10px] h-9 px-4 uppercase font-bold tracking-wider"
            >
              Enjoyment
            </Button>
            <Button
              variant={sortBy === 'time' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy(sortBy === 'time' ? 'none' : 'time')}
              className="text-[10px] h-9 px-4 uppercase font-bold tracking-wider"
            >
              Time
            </Button>
          </div>
        </div>

        {/* Column Headers */}
        <div className="hidden md:flex items-center justify-end px-2 mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground gap-1 pr-[8px]">
          <div className="w-16 text-center">Priority</div>
          <div className="w-16 text-center">Ease</div>
          <div className="w-16 text-center">Enjoy</div>
          <div className="w-16 text-center">Time</div>
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
