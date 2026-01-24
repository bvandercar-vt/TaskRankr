import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type TaskInput } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import type { TaskStatus } from "@shared/schema";

// Fetch all tasks
export function useTasks() {
  return useQuery({
    queryKey: [api.tasks.list.path],
    queryFn: async () => {
      const res = await fetch(api.tasks.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return api.tasks.list.responses[200].parse(await res.json());
    },
  });
}

// Custom hook to get parent chain for a task
export function useTaskParentChain(parentId?: number) {
  const { data: tasks } = useTasks();
  
  if (!parentId || !tasks) return [];
  
  const chain: { id: number; name: string }[] = [];
  let currentId: number | null | undefined = parentId;
  
  while (currentId) {
    const parent = tasks.find(t => t.id === currentId);
    if (parent) {
      chain.unshift({ id: parent.id, name: parent.name });
      currentId = parent.parentId;
    } else {
      break;
    }
  }
  
  return chain;
}

// Fetch single task
export function useTask(id: number) {
  return useQuery({
    queryKey: [api.tasks.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.tasks.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch task");
      return api.tasks.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

// Create a new task
export function useCreateTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: TaskInput) => {
      const res = await fetch(api.tasks.create.path, {
        method: api.tasks.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
           const error = api.tasks.create.responses[400].parse(await res.json());
           throw new Error(error.message);
        }
        throw new Error("Failed to create task");
      }
      return api.tasks.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
      toast({ title: "Task Created", description: "New task added to your list." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });
}

// Update a task
export function useUpdateTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<TaskInput>) => {
      const url = buildUrl(api.tasks.update.path, { id });
      // Validate with schema first to ensure partial is handled if needed, or trust TS
      const res = await fetch(url, {
        method: api.tasks.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
            const error = api.tasks.update.responses[400].parse(await res.json());
            throw new Error(error.message);
         }
        throw new Error("Failed to update task");
      }
      return api.tasks.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
    },
    onError: (error) => {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    }
  });
}

// Set task status
export function useSetTaskStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: TaskStatus }) => {
      const url = buildUrl(api.tasks.setStatus.path, { id });
      const res = await fetch(url, {
        method: api.tasks.setStatus.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update task status");
      return res.json();
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
      const messages: Record<TaskStatus, { title: string; description: string }> = {
        completed: { title: "Completed", description: "Task marked as complete." },
        in_progress: { title: "In Progress", description: "Task is now in progress." },
        pending: { title: "Pending", description: "Task moved to pending." },
        open: { title: "Restored", description: "Task moved back to active." },
      };
      toast(messages[status]);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });
}

// Delete a task (for actual deletion if ever needed)
export function useDeleteTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.tasks.delete.path, { id });
      const res = await fetch(url, { 
        method: api.tasks.delete.method,
        credentials: "include" 
      });

      if (!res.ok) throw new Error("Failed to delete task");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
      toast({ title: "Deleted", description: "Task removed successfully." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });
}

