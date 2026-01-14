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

type GroupOption = 'none' | 'priority' | 'ease' | 'enjoyment' | 'time';

export default function Home() {
  const { data: tasks, isLoading, error } = useTasks();
  const { openCreateDialog } = useTaskDialog();
  const [search, setSearch] = useState("");
  const [groupBy, setGroupBy] = useState<GroupOption>('none');

  // Recursive function to filter task tree
  const filterTree = (nodes: TaskResponse[], term: string): TaskResponse[] => {
    return nodes.reduce((acc: TaskResponse[], node) => {
      const matches = node.name.toLowerCase().includes(term.toLowerCase());
      const filteredSubtasks = node.subtasks ? filterTree(node.subtasks, term) : [];
      
      if (matches || filteredSubtasks.length > 0) {
        acc.push({ ...node, subtasks: filteredSubtasks });
      }
      return acc;
    }, []);
  };

  // Build tree from flat list if backend sends flat list
  // Note: Backend might send flat list or tree. 
  // Schema implies recursive type available but `api.tasks.list` returns Task[] (flat).
  // We need to reconstruct tree here if it is flat.
  const taskTree = useMemo(() => {
    if (!tasks) return [];
    
    // Deep clone to avoid mutating cache
    const nodes: Record<number, TaskResponse> = {};
    const roots: TaskResponse[] = [];
    
    // First pass: create nodes
    tasks.forEach(task => {
      nodes[task.id] = { ...task, subtasks: [] };
    });

    // Second pass: link children
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
    if (!search) return taskTree;
    return filterTree(taskTree, search);
  }, [taskTree, search]);

  // Grouping Logic (Flattens the tree for simpler grouping view)
  const groupedTasks = useMemo(() => {
    if (groupBy === 'none' || !tasks) return null;
    
    const groups: Record<string, TaskResponse[]> = {};
    const filteredFlat = tasks.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

    filteredFlat.forEach(task => {
      const key = String(task[groupBy as keyof Task] || 'Uncategorized');
      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    });

    return groups;
  }, [tasks, groupBy, search]);

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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search tasks..." 
              className="pl-10 bg-secondary/30 border-white/5 focus:border-primary/50 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-secondary/30 border-white/5 hover:bg-white/5 gap-2 min-w-[140px]">
                <SlidersHorizontal className="w-4 h-4" />
                {groupBy === 'none' ? 'Group By' : `By ${groupBy}`}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-white/10">
              <DropdownMenuLabel>Group View</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuRadioGroup value={groupBy} onValueChange={(v) => setGroupBy(v as GroupOption)}>
                <DropdownMenuRadioItem value="none">
                  <Network className="w-4 h-4 mr-2" /> Tree View (Default)
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="priority">Priority</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="ease">Ease</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="enjoyment">Enjoyment</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="time">Time Estimate</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Task List Area */}
        <div className="space-y-6">
          {/* Default Tree View */}
          {groupBy === 'none' && (
            <div className="space-y-1">
              {displayedTasks.length === 0 ? (
                <EmptyState onAdd={() => openCreateDialog()} isSearch={!!search} />
              ) : (
                displayedTasks.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))
              )}
            </div>
          )}

          {/* Grouped View */}
          {groupBy !== 'none' && groupedTasks && (
            <div className="space-y-8">
              {Object.entries(groupedTasks).map(([group, tasks]) => (
                <div key={group} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold capitalize font-display text-primary/90">{group}</h3>
                    <div className="h-px flex-1 bg-white/10"></div>
                    <span className="text-xs text-muted-foreground font-mono bg-secondary/50 px-2 py-1 rounded">
                      {tasks.length}
                    </span>
                  </div>
                  <div className="space-y-1 pl-2 border-l border-white/5">
                    {tasks.map(task => (
                      <TaskCard key={task.id} task={{...task, subtasks: []}} />
                    ))}
                  </div>
                </div>
              ))}
              {Object.keys(groupedTasks).length === 0 && (
                <EmptyState onAdd={() => openCreateDialog()} isSearch={!!search} />
              )}
            </div>
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
