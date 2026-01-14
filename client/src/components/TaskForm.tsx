import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTaskSchema, type Task, PRIORITY_LEVELS, EASE_LEVELS, ENJOYMENT_LEVELS, TIME_LEVELS } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus } from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils";

// Frontend validation schema
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

const getPriorityStyle = (val: string) => {
  switch (val) {
    case 'high': return 'text-red-400 border-red-400/20 bg-red-400/5';
    case 'medium': return 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5';
    case 'low': return 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5';
    default: return '';
  }
};

const getEaseStyle = (val: string) => {
  switch (val) {
    case 'hard': return 'text-red-400 border-red-400/20 bg-red-400/5';
    case 'medium': return 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5';
    case 'easy': return 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5';
    default: return '';
  }
};

const getEnjoymentStyle = (val: string) => {
  switch (val) {
    case 'low': return 'text-red-400 border-red-400/20 bg-red-400/5';
    case 'medium': return 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5';
    case 'high': return 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5';
    default: return '';
  }
};

const getTimeStyle = (val: string) => {
  switch (val) {
    case 'high': return 'text-red-400 border-red-400/20 bg-red-400/5';
    case 'medium': return 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5';
    case 'low': return 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5';
    default: return '';
  }
};

export function TaskForm({ onSubmit, isPending, initialData, parentId, onCancel, onAddChild }: TaskFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      description: initialData.description || "",
      priority: initialData.priority as any,
      ease: initialData.ease as any,
      enjoyment: initialData.enjoyment as any,
      time: initialData.time as any,
      parentId: initialData.parentId,
    } : {
      name: "",
      description: "",
      priority: "medium",
      ease: "medium",
      enjoyment: "medium",
      time: "medium",
      parentId: parentId || null,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground/80 font-medium">Task Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="What needs to be done?" 
                  className="bg-secondary/30 border-white/5 focus:border-primary/50 h-12 text-lg" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Priority</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className={cn("bg-secondary/30 border-white/5 transition-colors capitalize font-bold", getPriorityStyle(field.value))}>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-card border-white/10">
                    {PRIORITY_LEVELS.map((level) => (
                      <SelectItem key={level} value={level} className={cn("capitalize font-bold", getPriorityStyle(level))}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ease"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Ease</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className={cn("bg-secondary/30 border-white/5 transition-colors capitalize font-bold", getEaseStyle(field.value))}>
                      <SelectValue placeholder="Select ease" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-card border-white/10">
                    {EASE_LEVELS.map((level) => (
                      <SelectItem key={level} value={level} className={cn("capitalize font-bold", getEaseStyle(level))}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="enjoyment"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Enjoyment</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className={cn("bg-secondary/30 border-white/5 transition-colors capitalize font-bold", getEnjoymentStyle(field.value))}>
                      <SelectValue placeholder="Select enjoyment" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-card border-white/10">
                    {ENJOYMENT_LEVELS.map((level) => (
                      <SelectItem key={level} value={level} className={cn("capitalize font-bold", getEnjoymentStyle(level))}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Time Estimate</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className={cn("bg-secondary/30 border-white/5 transition-colors capitalize font-bold", getTimeStyle(field.value))}>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-card border-white/10">
                    {TIME_LEVELS.map((level) => (
                      <SelectItem key={level} value={level} className={cn("capitalize font-bold", getTimeStyle(level))}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground/80 font-medium">Details</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Add extra context, sub-steps, or notes..." 
                  className="bg-secondary/30 border-white/5 min-h-[120px] resize-none" 
                  {...field} 
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {initialData && onAddChild && (
          <div className="flex justify-start">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="bg-secondary/20 border-white/5 hover:bg-white/5 text-muted-foreground hover:text-foreground"
              onClick={() => onAddChild(initialData.id)}
            >
              <Plus className="w-3 h-3 mr-2" />
              Add Child Task
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancel} className="hover:bg-white/5">
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isPending}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white shadow-lg shadow-primary/20"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Save Changes" : "Create Task"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
