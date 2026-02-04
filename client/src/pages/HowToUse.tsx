/**
 * @fileoverview Instructional page explaining how to use the app
 */

import {
  ArrowLeft,
  ArrowUpDown,
  CheckCircle2,
  FolderTree,
  Hand,
  MousePointer2,
  Pin,
  PlayCircle,
} from "lucide-react";
import { Link } from "wouter";

import { Button } from "@/components/primitives/button";
import { Card, CardContent } from "@/components/primitives/card";
import { SortInfo } from "@/components/SortInfo";

const InstructionCard = ({
  icon,
  title,
  description,
  testId,
}: {
  icon: React.ReactNode;
  title: React.ReactNode;
  description: React.ReactNode;
  testId: string;
}) => (
  <Card className="bg-card/50 border-white/10" data-testid={testId}>
    <CardContent className="p-4 flex items-start gap-4">
      <div className="shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </CardContent>
  </Card>
);

const HowToUse = () => {
  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">How To Use</h1>
        </div>

        <div className="space-y-6">
          <section data-testid="section-working-with-tasks">
            <h2 className="text-lg font-semibold mb-3 text-primary">
              Working with Tasks
            </h2>
            <div className="space-y-3">
              <InstructionCard
                icon={<MousePointer2 className="h-5 w-5" />}
                title="Tap to Edit"
                description="Tap any task card to open the edit form where you can change the name, description, and rank fields like priority, ease, enjoyment, and time, as well as create nested subtasks to assist with breaking down big projects."
                testId="card-tap-to-edit"
              />
              <InstructionCard
                icon={<Hand className="h-5 w-5" />}
                title="Hold to Change Status"
                description="Press and hold a task card for about a second to open the status menu. From there you can mark it as Pinned, In Progress (if setting enabled), or Completed."
                testId="card-hold-to-change-status"
              />
            </div>
          </section>

          <section data-testid="section-sorting">
            <h2 className="text-lg font-semibold mb-3 text-primary">
              Sorting Taks
            </h2>
            <div className="space-y-3">
              <InstructionCard
                icon={<ArrowUpDown className="h-5 w-5" />}
                title="Sort Options"
                description={
                  <>
                    <div className="mb-4">
                      Use the sort buttons at the top of the task list to order
                      tasks by date created, priority, ease, enjoyment, or time.
                      You can customize which rank fields are visible in
                      Settings.
                    </div>
                    <SortInfo defaultExpanded={false} testIdPrefix="howto" />
                  </>
                }
                testId="card-sorting"
              />
            </div>
          </section>

          <section data-testid="section-task-statuses">
            <h2 className="text-lg font-semibold mb-3 text-primary">
              Task Statuses
            </h2>
            <div className="space-y-3">
              <InstructionCard
                icon={<Pin className="h-5 w-5" />}
                title="Pinned"
                description="Pin important tasks to keep them at the top of your list, below any In Progress task. You can have multiple pinned tasks."
                testId="card-pinned"
              />
              <InstructionCard
                icon={<PlayCircle className="h-5 w-5" />}
                title="In Progress (if setting enabled)"
                description="Only one task can be In Progress at a time. It appears at the very top of your list with a blue border. Time spent is tracked if you have that setting enabled."
                testId="card-in-progress"
              />
              <InstructionCard
                icon={<CheckCircle2 className="h-5 w-5" />}
                title="Completed"
                description="Mark tasks as done when finished. Completed tasks are moved to a separate list you can access from the menu."
                testId="card-completed"
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default HowToUse;
