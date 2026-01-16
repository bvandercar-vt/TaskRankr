import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTaskSchema, type Task, PRIORITY_LEVELS, EASE_LEVELS, ENJOYMENT_LEVELS, TIME_LEVELS } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Calendar } from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const formSchema = insertTaskSchema;
type FormValues = z.infer<typeof formSchema>;

interface TaskFormProps {
  onSubmit: (data: FormValues) => void;
  isPending: boolean;
  initialData?: Task;
  parentId?: number | null;
  onCancel: () => void;
  onAddChild?: (parentId: number) => void;
}

const LEVEL_STYLES: Record<string, string> = {
  high: 'text-red-400 border-red-400/20 bg-red-400/5',
  hard: 'text-red-400 border-red-400/20 bg-red-400/5',
  medium: 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5',
  low: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5',
  easy: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5',
};

const getLevelStyle = (val: string) => LEVEL_STYLES[val] || '';

export function TaskForm({ onSubmit, isPending, initialData, parentId, onCancel, onAddChild }: TaskFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      description: initialData.description || "",
      priority: (initialData.priority as any) || "none",
      ease: (initialData.ease as any) || "none",
      enjoyment: (initialData.enjoyment as any) || "none",
      time: (initialData.time as any) || "none",
      parentId: initialData.parentId,
      createdAt: initialData.createdAt ? new Date(initialData.createdAt) : new Date(),
      completedAt: initialData.completedAt ? new Date(initialData.completedAt) : null,
    } : {
      name: "",
      description: "",
      priority: parentId ? "none" : "medium",
      ease: parentId ? "none" : "medium",
      enjoyment: parentId ? "none" : "medium",
      time: parentId ? "none" : "medium",
      parentId: parentId || null,
      createdAt: new Date(),
    },
  });

  const onSubmitWithNulls = (data: FormValues) => {
    const formattedData = {
      ...data,
      priority: data.priority === "none" ? null : data.priority,
      ease: data.ease === "none" ? null : data.ease,
      enjoyment: data.enjoyment === "none" ? null : data.enjoyment,
      time: data.time === "none" ? null : data.time,
    };
    onSubmit(formattedData as any);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitWithNulls)} className="flex flex-col h-full space-y-6">
        <div className="flex-1 space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Task Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Task name" 
                    className="bg-secondary/20 border-white/5 h-12 text-lg focus-visible:ring-primary/50" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            {[
              { name: 'priority', label: 'Priority', levels: PRIORITY_LEVELS },
              { name: 'ease', label: 'Ease', levels: EASE_LEVELS },
              { name: 'enjoyment', label: 'Enjoyment', levels: ENJOYMENT_LEVELS },
              { name: 'time', label: 'Time', levels: TIME_LEVELS },
            ].map((attr) => (
              <FormField
                key={attr.name}
                control={form.control}
                name={attr.name as any}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">{attr.label}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || "none"}>
                        <FormControl>
                          <SelectTrigger className={cn("bg-secondary/20 border-white/5 capitalize font-semibold h-10", field.value ? getLevelStyle(field.value) : "text-muted-foreground")}>
                            <SelectValue placeholder="Not set" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-card border-white/10 z-[200]">
                          <SelectItem value="none" className="text-muted-foreground italic">Not set</SelectItem>
                          {attr.levels.map((level) => (
                            <SelectItem key={level} value={level} className={cn("capitalize font-semibold", getLevelStyle(level))}>
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                  </FormItem>
                )}
              />
            ))}
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Additional details..." 
                    className="bg-secondary/20 border-white/5 min-h-[120px] resize-none focus-visible:ring-primary/50" 
                    {...field} 
                    value={field.value || ""}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="flex flex-col gap-4 py-2 border-t border-white/5 mt-4">
            <FormField
              control={form.control}
              name="createdAt"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-4">
                  <div>
                    <FormLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Date Created</FormLabel>
                  </div>
                  <FormControl>
                    <Input 
                      type="datetime-local"
                      className="w-auto bg-secondary/10 border-white/5 h-8 text-xs py-1"
                      value={field.value ? format(field.value, "yyyy-MM-dd'T'HH:mm") : ""}
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {initialData?.isCompleted && initialData?.completedAt && (
              <div className="flex items-center justify-between gap-4">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Date Completed</div>
                <div className="text-xs text-emerald-400/70 bg-emerald-400/5 px-2 py-1 rounded border border-emerald-400/10">
                  {format(new Date(initialData.completedAt), "PPP p")}
                </div>
              </div>
            )}
          </div>

          {initialData && onAddChild && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full bg-secondary/10 border-white/5 hover:bg-secondary/20 h-10"
              onClick={() => onAddChild(initialData.id)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Subtask
            </Button>
          )}
        </div>

        <div className="sticky bottom-0 pt-4 pb-6 bg-background/80 backdrop-blur-sm mt-auto flex gap-3 border-t border-white/5">
          <Button type="button" variant="ghost" onClick={onCancel} className="flex-1 h-12">
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isPending}
            className="flex-[2] h-12 bg-primary hover:bg-primary/90 text-white font-bold"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Save" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
