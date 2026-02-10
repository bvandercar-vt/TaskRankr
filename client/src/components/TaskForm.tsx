/**
 * @fileoverview Form component for creating and editing tasks
 */

import { useCallback, useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { omit, pick } from "es-toolkit";
import { Calendar as CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/primitives/Button";
import { Calendar } from "@/components/primitives/forms/Calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/primitives/forms/Form";
import { Input } from "@/components/primitives/forms/Input";
import { Textarea } from "@/components/primitives/forms/Textarea";
import { TimeInput } from "@/components/primitives/forms/TimeInput";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/primitives/overlays/Popover";
import { TagChain } from "@/components/primitives/TagChain";
import { RankFieldSelect } from "@/components/RankFieldSelect";
import { SubtasksCard } from "@/components/SubtasksCard";
import { useSettings } from "@/hooks/useSettings";
import { useTaskParentChain } from "@/hooks/useTasks";
import { RANK_FIELDS_COLUMNS } from "@/lib/sort-tasks";
import { cn } from "@/lib/utils";
import {
  insertTaskSchema,
  type MutateTask,
  type RankField,
  type Task,
  TaskStatus,
} from "~/shared/schema";
import type {
  DeleteTaskArgs,
  MutateTaskContent,
} from "./providers/LocalStateProvider";

interface DateCreatedInputProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
}

const DateCreatedInput = ({ value, onChange }: DateCreatedInputProps) => (
  <FormItem className="flex items-center justify-between gap-4">
    <div>
      <FormLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
        Date Created
      </FormLabel>
    </div>
    <Popover>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant={"outline"}
            className={cn(
              "w-auto bg-secondary/10 border-white/5 h-8 text-xs py-1 px-3 font-normal",
              !value && "text-muted-foreground",
            )}
          >
            {value ? format(value, "PPP") : <span>Pick a date</span>}
            <CalendarIcon className="ml-2 h-3 w-3 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 bg-card border-white/10 z-[300]"
        align="end"
      >
        <div className="p-3 border-b border-white/5 bg-secondary/50 text-[10px] uppercase tracking-wider text-muted-foreground text-center">
          Select Creation Date
        </div>
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          initialFocus
          className="rounded-md border-0"
        />
      </PopoverContent>
    </Popover>
  </FormItem>
);

export interface TaskFormProps {
  onSubmit: (data: MutateTaskContent) => void;
  initialData?: Task;
  parentId?: number | null;
  onCancel: () => void;
  onAddChild?: (parentId: number) => void;
  onEditChild?: (task: Task) => void;
  onSubtaskDelete?: (task: DeleteTaskArgs) => void;
}

export const TaskForm = ({
  onSubmit,
  initialData,
  parentId,
  onCancel,
  onAddChild,
  onEditChild,
  onSubtaskDelete,
}: TaskFormProps) => {
  const parentChain = useTaskParentChain(parentId ?? undefined);
  const { settings } = useSettings();

  const rankFieldConfig = useMemo(
    () =>
      new Map(
        RANK_FIELDS_COLUMNS.map(({ name }) => {
          const { visible, required: rawRequired } = settings.fieldConfig[name];
          const required = visible && rawRequired;
          return [name, { visible, required }];
        }),
      ),
    [settings],
  );

  const visibleRankFields = useMemo(
    () =>
      RANK_FIELDS_COLUMNS.filter(
        (attr) => rankFieldConfig.get(attr.name)?.visible,
      ),
    [rankFieldConfig],
  );

  const formSchema = useMemo(
    () =>
      insertTaskSchema
        .omit({ userId: true })
        .required(
          Object.fromEntries(
            RANK_FIELDS_COLUMNS.map(({ name }) => [
              name,
              Boolean(rankFieldConfig.get(name)?.required),
            ]).filter(([, isReq]) => isReq),
          ) satisfies Record<RankField, boolean>,
        ),
    [rankFieldConfig],
  );

  const getFormDefaults = useCallback(
    (data: Task | undefined): MutateTaskContent =>
      data
        ? {
            description: data.description ?? "",
            ...pick(data, [
              "name",
              "priority",
              "ease",
              "enjoyment",
              "time",
              "parentId",
              "inProgressTime",
            ]),
            createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
            completedAt: data.completedAt ? new Date(data.completedAt) : null,
          }
        : {
            name: "",
            description: "",
            priority: null,
            ease: null,
            enjoyment: null,
            time: null,
            parentId: parentId ?? null,
            createdAt: new Date(),
            inProgressTime: 0,
          },
    [parentId],
  );

  const form = useForm<MutateTask>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: getFormDefaults(initialData),
  });
  const {
    formState: { isValid },
  } = form;

  useEffect(() => {
    form.reset(getFormDefaults(initialData));
  }, [initialData, form, getFormDefaults]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: is necessary
  useEffect(() => {
    void form.trigger();
  }, [rankFieldConfig, form]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) =>
          onSubmit(omit(data, ["subtaskSortMode", "subtaskOrder"])),
        )}
        className="flex flex-col h-full"
      >
        <div className="flex-1 space-y-5">
          {parentChain.length > 0 && (
            <TagChain
              items={parentChain}
              label="Parent"
              className="px-1 mb-2"
            />
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

          {visibleRankFields.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {visibleRankFields.map(({ name, label, levels }) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <RankFieldSelect
                      name={name}
                      label={label}
                      levels={levels}
                      field={field}
                      isRequired={Boolean(rankFieldConfig.get(name)?.required)}
                    />
                  )}
                />
              ))}
            </div>
          )}

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  Description
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Additional details..."
                    className="bg-secondary/20 border-white/5 min-h-[50px] resize-none focus-visible:ring-primary/50"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {initialData && onAddChild && (
            <SubtasksCard
              task={initialData}
              onAddChild={onAddChild}
              onEditChild={onEditChild}
              onSubtaskDelete={onSubtaskDelete}
            />
          )}

          <div className="flex flex-col gap-4 mt-2">
            <FormField
              control={form.control}
              name="createdAt"
              render={({ field }) => (
                <DateCreatedInput
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />

            {initialData?.status === TaskStatus.COMPLETED && (
              <>
                {initialData?.completedAt && (
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Date Completed
                    </div>
                    <div className="text-xs text-emerald-400/70 bg-emerald-400/5 px-2 py-1 rounded border border-emerald-400/10">
                      {format(new Date(initialData.completedAt), "PPP p")}
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between gap-4">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Time Spent
                  </div>
                  <TimeInput
                    durationMs={form.watch("inProgressTime") || 0}
                    onDurationChange={(ms) =>
                      form.setValue("inProgressTime", ms)
                    }
                    className="w-16 h-8 text-xs bg-secondary/20 border-white/5 text-center"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 pt-2 pb-4 flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 h-12 border-white/10"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!isValid}
            className="flex-1 h-12 bg-primary hover:bg-primary/90 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {initialData ? "Save" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
