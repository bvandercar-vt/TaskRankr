import { useState, useMemo } from "react";
import { useTasks } from "@/hooks/use-tasks";
import { getSettings } from "@/hooks/use-settings";
import type { TaskResponse, TaskSortField } from "@shared/schema";
import { TaskCard } from "@/components/TaskCard";
import { Button } from "@/components/primitives/button";
import { useTaskDialog } from "@/components/TaskDialogProvider";
import {
  Plus,
  Search,
  Menu,
  CheckCircle2,
  LayoutList,
  Settings,
} from "lucide-react";
import { Input } from "@/components/primitives/forms/input";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/primitives/dropdown-menu";

type SortOption = "date" | TaskSortField;

const SortButton = ({
  label,
  value,
  className,
  current,
  onSelect,
}: {
  label: string;
  value: SortOption;
  className?: string;
  current: SortOption;
  onSelect: (v: SortOption) => void;
}) => (
  <Button
    variant={current === value ? "default" : "ghost"}
    size="sm"
    onClick={() => onSelect(value)}
    className={cn(
      "h-8 p-0 text-[10px] font-bold uppercase tracking-wider transition-all rounded-md no-default-hover-elevate no-default-active-elevate",
      current === value
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:text-foreground hover:bg-white/5",
      className,
    )}
    data-testid={`button-sort-${value}`}
  >
    {label}
  </Button>
);

const LEVEL_WEIGHTS: Record<string, number> = {
  highest: 5,
  high: 4,
  hard: 4,
  medium: 3,
  low: 2,
  easy: 2,
  lowest: 1,
};

const SORT_DIRECTIONS: Record<string, "asc" | "desc"> = {
  date: "desc",
  priority: "desc",
  ease: "asc",
  enjoyment: "desc",
  time: "asc",
};

const Home = () => {
  const { data: tasks, isLoading, error } = useTasks();
  const { openCreateDialog } = useTaskDialog();
  const [search, setSearch] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("date");

  // Sort function for tasks
  const sortTasks = (tasks: TaskResponse[], sort: SortOption): TaskResponse[] => {
    const sorted = [...tasks];
    if (sort === "date") {
      sorted.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
    } else {
      sorted.sort((a, b) => {
        const direction = SORT_DIRECTIONS[sort] || "desc";
        const valA =
          LEVEL_WEIGHTS[a[sort as keyof TaskResponse] as string] || 0;
        const valB =
          LEVEL_WEIGHTS[b[sort as keyof TaskResponse] as string] || 0;

        if (valA !== valB) {
          return direction === "desc" ? valB - valA : valA - valB;
        }

        const pA = LEVEL_WEIGHTS[a.priority as string] || 0;
        const pB = LEVEL_WEIGHTS[b.priority as string] || 0;
        const eA = LEVEL_WEIGHTS[a.ease as string] || 0;
        const eB = LEVEL_WEIGHTS[b.ease as string] || 0;
        const jA = LEVEL_WEIGHTS[a.enjoyment as string] || 0;
        const jB = LEVEL_WEIGHTS[b.enjoyment as string] || 0;

        if (sort === "priority") {
          if (eA !== eB) return eA - eB;
          return jB - jA;
        }
        if (sort === "ease") {
          if (pA !== pB) return pB - pA;
          return jB - jA;
        }
        if (sort === "enjoyment") {
          if (pA !== pB) return pB - pA;
          return eA - eB;
        }
        if (sort === "time") {
          if (pA !== pB) return pB - pA;
          if (eA !== eB) return eA - eB;
          return pB - pA;
        }
        return 0;
      });
    }
    return sorted;
  };

  // Recursive function to filter task tree
  const filterAndSortTree = (
    nodes: TaskResponse[],
    term: string,
    sort: SortOption,
  ): TaskResponse[] => {
    const result = nodes.reduce((acc: TaskResponse[], node) => {
      const matches = node.name.toLowerCase().includes(term.toLowerCase());
      const filteredSubtasks = node.subtasks
        ? filterAndSortTree(node.subtasks, term, sort)
        : [];

      if (matches || filteredSubtasks.length > 0) {
        acc.push({ ...node, subtasks: filteredSubtasks });
      }
      return acc;
    }, []);

    return sortTasks(result, sort);
  };

  // Build tree from flat list, excluding completed tasks
  // Also extract in-progress and pending tasks to be hoisted to top
  const { taskTree, pinnedTasks } = useMemo(() => {
    if (!tasks) return { taskTree: [], pinnedTasks: [] };

    // Filter out completed tasks
    const activeTasks = tasks.filter((task) => task.status !== "completed");

    // Collect pinned tasks (in_progress first, then pinned) to display at top
    const pinnedTaskIds = new Set<number>();
    const inProgressList: TaskResponse[] = [];
    const pinnedList: TaskResponse[] = [];

    activeTasks.forEach((task) => {
      if (task.status === "in_progress") {
        pinnedTaskIds.add(task.id);
        inProgressList.push({ ...task, subtasks: [] } as TaskResponse);
      } else if (task.status === "pinned") {
        pinnedTaskIds.add(task.id);
        pinnedList.push({ ...task, subtasks: [] } as TaskResponse);
      }
    });

    // Hoisted order: in_progress first, then pinned
    const hoistedList = [...inProgressList, ...pinnedList];

    const nodes: Record<number, TaskResponse> = {};
    const roots: TaskResponse[] = [];

    activeTasks.forEach((task) => {
      if (pinnedTaskIds.has(task.id)) return;
      nodes[task.id] = { ...task, subtasks: [] } as TaskResponse;
    });

    activeTasks.forEach((task) => {
      if (pinnedTaskIds.has(task.id)) return;

      // If parent is pinned, treat as root level
      if (task.parentId && nodes[task.parentId]) {
        nodes[task.parentId].subtasks?.push(nodes[task.id]);
      } else if (!task.parentId || !pinnedTaskIds.has(task.parentId)) {
        roots.push(nodes[task.id]);
      } else {
        // Parent is pinned, so this becomes a root
        roots.push(nodes[task.id]);
      }
    });

    return { taskTree: roots, pinnedTasks: hoistedList };
  }, [tasks]);

  const displayedTasks = useMemo(() => {
    if (!taskTree) return [];
    const sortedTree = filterAndSortTree(taskTree, search, sortBy);

    // Filter pinned tasks by search term
    const filteredPinned = pinnedTasks.filter((task) =>
      task.name.toLowerCase().includes(search.toLowerCase()),
    );

    // Separate in_progress (always first) from pinned, then sort pinned
    const inProgressTask = filteredPinned.filter((t) => t.status === "in_progress");
    const pinnedOnly = filteredPinned.filter((t) => t.status === "pinned");
    
    // Sort pinned: by priority first if setting enabled, then by current sort as secondary
    const settings = getSettings();
    let sortedPinned: TaskResponse[];
    if (settings.alwaysSortPinnedByPriority && sortBy !== "priority") {
      // Sort by priority first, with current sortBy as secondary
      sortedPinned = [...pinnedOnly].sort((a, b) => {
        const pA = LEVEL_WEIGHTS[a.priority as string] || 0;
        const pB = LEVEL_WEIGHTS[b.priority as string] || 0;
        if (pA !== pB) return pB - pA; // Priority descending
        
        // Secondary sort by current sortBy
        if (sortBy === "date") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        const direction = SORT_DIRECTIONS[sortBy] || "desc";
        const valA = LEVEL_WEIGHTS[a[sortBy as keyof TaskResponse] as string] || 0;
        const valB = LEVEL_WEIGHTS[b[sortBy as keyof TaskResponse] as string] || 0;
        return direction === "desc" ? valB - valA : valA - valB;
      });
    } else {
      sortedPinned = sortTasks(pinnedOnly, sortBy);
    }

    // Combine: in_progress first, then sorted pinned, then sorted tree
    return [...inProgressTask, ...sortedPinned, ...sortedTree];
  }, [taskTree, pinnedTasks, search, sortBy]);

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
        <div className="flex items-center justify-between mb-4 pr-2">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10"
                  data-testid="button-menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="bg-card border-white/10 w-48"
              >
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </DropdownMenuItem>
                <Link href="/completed">
                  <DropdownMenuItem
                    className="cursor-pointer"
                    data-testid="menu-item-completed"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Completed Tasks
                  </DropdownMenuItem>
                </Link>
                <Link href="/settings">
                  <DropdownMenuItem
                    className="cursor-pointer"
                    data-testid="menu-item-settings"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>

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

          <div className="flex items-center gap-1">
            <SortButton
              label="Date"
              value="date"
              className="min-w-12 max-w-16"
              current={sortBy}
              onSelect={setSortBy}
            />
            <SortButton
              label="Priority"
              value="priority"
              className="w-16"
              current={sortBy}
              onSelect={setSortBy}
            />
            <SortButton
              label="Ease"
              value="ease"
              className="w-16"
              current={sortBy}
              onSelect={setSortBy}
            />
            <SortButton
              label="Enjoy"
              value="enjoyment"
              className="w-16"
              current={sortBy}
              onSelect={setSortBy}
            />
            <SortButton
              label="Time"
              value="time"
              className="w-16"
              current={sortBy}
              onSelect={setSortBy}
            />
          </div>
        </div>

        <div className="space-y-1">
          {displayedTasks.length === 0 ? (
            <EmptyState onAdd={() => openCreateDialog()} isSearch={!!search} />
          ) : (
            displayedTasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </div>
      </main>

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
};

const EmptyState = ({
  onAdd,
  isSearch,
}: {
  onAdd: () => void;
  isSearch: boolean;
}) => (
  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
    <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-2">
      {isSearch ? (
        <Search className="w-8 h-8 text-muted-foreground" />
      ) : (
        <LayoutList className="w-8 h-8 text-muted-foreground" />
      )}
    </div>
    <h3 className="text-xl font-medium text-foreground">
      {isSearch ? "No matching tasks found" : "Your list is empty"}
    </h3>
    <p className="text-muted-foreground max-w-sm">
      {isSearch
        ? "Try adjusting your search terms."
        : "Start by adding your first task to get organized."}
    </p>
    {!isSearch && (
      <Button onClick={onAdd} variant="secondary" className="mt-4">
        Create First Task
      </Button>
    )}
  </div>
);

export default Home;
