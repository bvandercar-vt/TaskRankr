import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { insertTaskSchema, type Task, PRIORITY_LEVELS, EASE_LEVELS, ENJOYMENT_LEVELS, TIME_LEVELS } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/forms/form";
import { Input } from "@/components/ui/forms/input";
import { Textarea } from "@/components/ui/forms/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/forms/select";
import { Loader2, Plus, Calendar as CalendarIcon, ChevronRight } from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/forms/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/dialogs/popover";
import { useTaskParentChain } from "@/hooks/use-tasks";

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
  highest: 'text-red-600 border-red-600/20 bg-red-600/5',
  high: 'text-red-400 border-red-400/20 bg-red-400/5',
  hard: 'text-red-400 border-red-400/20 bg-red-400/5',
  medium: 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5',
  low: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5',
  lowest: 'text-emerald-600/60 border-emerald-600/10 bg-emerald-600/5',
  easy: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5',
  none: 'text-muted-foreground italic',
};

// Enjoyment is reversed: high = good (green), low = bad (red)
const ENJOYMENT_STYLES: Record<string, string> = {
  high: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5',
  medium: 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5',
  low: 'text-red-400 border-red-400/20 bg-red-400/5',
  none: 'text-muted-foreground italic',
};

const getLevelStyle = (val: string, field?: string) => {
  if (field === 'enjoyment') return ENJOYMENT_STYLES[val] || '';
  return LEVEL_STYLES[val] || '';
};

export function TaskForm({ onSubmit, isPending, initialData, parentId, onCancel, onAddChild }: TaskFormProps) {
  const parentChain = useTaskParentChain(parentId || undefined);

  const extendedSchema = insertTaskSchema.extend({
    priority: z.string().min(1, "Priority is required"),
    ease: z.string().min(1, "Ease is required"),
    enjoyment: z.string().min(1, "Enjoyment is required"),
    time: z.string().min(1, "Time is required"),
  });

  const formSchemaToUse = parentId ? insertTaskSchema : extendedSchema;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchemaToUse),
    mode: "onChange",
    defaultValues: initialData ? {
      name: initialData.name,
      description: initialData.description || "",
      priority: (initialData.priority as any) || (parentId ? "none" : ""),
      ease: (initialData.ease as any) || (parentId ? "none" : ""),
      enjoyment: (initialData.enjoyment as any) || (parentId ? "none" : ""),
      time: (initialData.time as any) || (parentId ? "none" : ""),
      parentId: initialData.parentId,
      createdAt: initialData.createdAt ? new Date(initialData.createdAt) : new Date(),
      completedAt: initialData.completedAt ? new Date(initialData.completedAt) : null,
    } : {
      name: "",
      description: "",
      priority: parentId ? "none" : "",
      ease: parentId ? "none" : "",
      enjoyment: parentId ? "none" : "",
      time: parentId ? "none" : "",
      parentId: parentId || null,
      createdAt: new Date(),
    },
  });

  // Use useEffect to reset form when initialData or parentId changes
  // to ensure "Add Subtask" dialog is clean.
  useEffect(() => {
    form.reset(initialData ? {
      name: initialData.name,
      description: initialData.description || "",
      priority: (initialData.priority as any) || (parentId ? "none" : ""),
      ease: (initialData.ease as any) || (parentId ? "none" : ""),
      enjoyment: (initialData.enjoyment as any) || (parentId ? "none" : ""),
      time: (initialData.time as any) || (parentId ? "none" : ""),
      parentId: initialData.parentId,
      createdAt: initialData.createdAt ? new Date(initialData.createdAt) : new Date(),
      completedAt: initialData.completedAt ? new Date(initialData.completedAt) : null,
    } : {
      name: "",
      description: "",
      priority: parentId ? "none" : "",
      ease: parentId ? "none" : "",
      enjoyment: parentId ? "none" : "",
      time: parentId ? "none" : "",
      parentId: parentId || null,
      createdAt: new Date(),
    });
  }, [initialData, parentId, form]);

  const onSubmitWithNulls = (data: FormValues) => {
    const formattedData = {
      ...data,
      priority: data.priority === "none" || data.priority === "" ? null : data.priority,
      ease: data.ease === "none" || data.ease === "" ? null : data.ease,
      enjoyment: data.enjoyment === "none" || data.enjoyment === "" ? null : data.enjoyment,
      time: data.time === "none" || data.time === "" ? null : data.time,
    };
    onSubmit(formattedData as any);
  };

  const isValid = form.formState.isValid;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitWithNulls)} className="flex flex-col h-full space-y-6">
        <div className="flex-1 space-y-6">
          {parentChain.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap px-1 mb-2">
              {parentChain.map((p, idx) => (
                <div key={p.id} className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 bg-secondary/10 px-2 py-0.5 rounded border border-white/5">
                    {p.name}
                  </span>
                  {idx < parentChain.length - 1 && (
                    <ChevronRight className="w-3 h-3 text-muted-foreground/30" />
                  )}
                </div>
              ))}
            </div>
          )}
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
                      <Select onValueChange={field.onChange} value={field.value || (parentId ? "none" : "")}>
                        <FormControl>
                          <SelectTrigger className={cn("bg-secondary/20 border-white/5 capitalize font-semibold h-10", (field.value && field.value !== "none") ? getLevelStyle(field.value, attr.name) : "text-muted-foreground")}>
                            <SelectValue placeholder={parentId ? "None" : "Select..."} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-card border-white/10 z-[200]">
                          {parentId && <SelectItem value="none" className="text-muted-foreground italic">None</SelectItem>}
                          {attr.levels.map((level) => (
                            <SelectItem key={level} value={level} className={cn("capitalize font-semibold", getLevelStyle(level, attr.name))}>
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
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-auto bg-secondary/10 border-white/5 h-8 text-xs py-1 px-3 font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-2 h-3 w-3 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-card border-white/10 z-[300]" align="end">
                      <div className="p-3 border-b border-white/5 bg-secondary/50 text-[10px] uppercase tracking-wider text-muted-foreground text-center">
                        Select Creation Date
                      </div>
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date);
                          // We don't close automatically to allow checking the date, 
                          // but the user can tap outside to close.
                        }}
                        initialFocus
                        className="rounded-md border-0"
                      />
                    </PopoverContent>
                  </Popover>
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
            disabled={isPending || !isValid}
            className="flex-[2] h-12 bg-primary hover:bg-primary/90 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Save" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
