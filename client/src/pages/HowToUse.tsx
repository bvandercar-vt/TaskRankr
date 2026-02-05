/**
 * @fileoverview Instructional page explaining how to use the app
 */

import {
  ArrowLeft,
  ArrowUpDown,
  CheckCircle2,
  GripVertical,
  Hand,
  Layers,
  MousePointer2,
  Pin,
  PlayCircle,
} from 'lucide-react'
import { Link } from 'wouter'

import { Button } from '@/components/primitives/Button'
import { Card, CardContent } from '@/components/primitives/Card'
import { SortInfo } from '@/components/SortInfo'
import { IconSizeStyle } from '@/lib/constants'

const InstructionCard = ({
  icon,
  title,
  description,
  testId,
}: {
  icon: React.ReactNode
  title: React.ReactNode
  description: React.ReactNode
  testId: string
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
)

const HowToUse = () => {
  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className={IconSizeStyle.HW5} />
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
                icon={<MousePointer2 className={IconSizeStyle.HW5} />}
                title="Tap to Edit"
                description="Tap any task card to open the edit form where you can change the name, description, and rank fields like priority, ease, enjoyment, and time, as well as create nested subtasks to assist with breaking down big projects."
                testId="card-tap-to-edit"
              />
              <InstructionCard
                icon={<Hand className={IconSizeStyle.HW5} />}
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
                icon={<ArrowUpDown className={IconSizeStyle.HW5} />}
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

          <section data-testid="section-subtasks">
            <h2 className="text-lg font-semibold mb-3 text-primary">
              Subtasks
            </h2>
            <div className="space-y-3">
              <InstructionCard
                icon={<Layers className={IconSizeStyle.HW5} />}
                title="Nested Tasks"
                description="Break down large tasks into subtasks by tapping a task and using the Add Subtask button. Subtasks can have their own subtasks, creating a hierarchical structure for complex projects."
                testId="card-nested-tasks"
              />
              <InstructionCard
                icon={<GripVertical className={IconSizeStyle.HW5} />}
                title="Manual Ordering"
                description="By default, subtasks follow the same sort order as the main list. Toggle Manual mode in the subtasks panel to drag and reorder subtasks in a custom sequence, perfect for step-by-step workflows."
                testId="card-manual-ordering"
              />
            </div>
          </section>

          <section data-testid="section-task-statuses">
            <h2 className="text-lg font-semibold mb-3 text-primary">
              Task Statuses
            </h2>
            <div className="space-y-3">
              <InstructionCard
                icon={<Pin className={IconSizeStyle.HW5} />}
                title="Pinned"
                description="Pin important tasks to keep them at the top of your list, below any In Progress task. You can have multiple pinned tasks."
                testId="card-pinned"
              />
              <InstructionCard
                icon={<PlayCircle className={IconSizeStyle.HW5} />}
                title="In Progress (if setting enabled)"
                description="Only one task can be In Progress at a time. It appears at the very top of your list with a blue border. Time spent is tracked if you have that setting enabled."
                testId="card-in-progress"
              />
              <InstructionCard
                icon={<CheckCircle2 className={IconSizeStyle.HW5} />}
                title="Completed"
                description="Mark tasks as done when finished. Completed tasks are moved to a separate list you can access from the menu."
                testId="card-completed"
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default HowToUse
