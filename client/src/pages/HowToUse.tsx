/**
 * @fileoverview Instructional page explaining how to use the app
 */

import { isStandalonePWA } from 'is-standalone-pwa'
import {
  ArrowUpDown,
  CheckCircle2,
  ChevronRight,
  Download,
  GripVertical,
  Hand,
  Layers,
  MousePointer2,
  Pin,
  PlayCircle,
  Settings,
} from 'lucide-react'
import { Link } from 'wouter'

import { BackButtonHeader } from '@/components/BackButton'
import { ContactCard } from '@/components/ContactCard'
import { IconCard } from '@/components/primitives/IconCard'
import { ScrollablePage } from '@/components/primitives/ScrollablePage'
import { SortInfo } from '@/components/SortInfo'
import { IconSize, Routes } from '@/lib/constants'

const HowToUse = () => {
  const isStandalone = isStandalonePWA()

  return (
    <ScrollablePage className="pb-16">
      <BackButtonHeader title="How To Use" />

      <div className="space-y-6">
        <section data-testid="section-working-with-tasks">
          <h2 className="text-lg font-semibold mb-3 text-primary">
            Working with Tasks
          </h2>
          <div className="space-y-3">
            <IconCard
              icon={<MousePointer2 className={IconSize.HW5} />}
              title="Tap to Edit"
              description="Tap a task to edit it, where you can change the name, description, and rank fields like priority, ease, enjoyment, and time, as well as create nested subtasks to assist with breaking down projects."
              testId="card-tap-to-edit"
            />
            <IconCard
              icon={<Hand className={IconSize.HW5} />}
              title="Hold to Change Status"
              description="Press and hold a task to open the status menu. From there you can mark it as Pinned, In Progress (if setting enabled), Completed, or Delete it."
              testId="card-hold-to-change-status"
            />
          </div>
        </section>

        <section data-testid="section-sorting">
          <h2 className="text-lg font-semibold mb-3 text-primary">
            Sorting Taks
          </h2>
          <div className="space-y-3">
            <IconCard
              icon={<ArrowUpDown className={IconSize.HW5} />}
              title="Sort Options"
              description={
                <>
                  <div className="mb-4">
                    Use the sort buttons at the top of the task list to order
                    tasks by date created, priority, ease, enjoyment, or time.
                    You can customize which rank fields are visible in Settings.
                  </div>
                  <SortInfo defaultExpanded={false} />
                </>
              }
              testId="card-sorting"
            />
          </div>
        </section>

        <section data-testid="section-subtasks">
          <h2 className="text-lg font-semibold mb-3 text-primary">Subtasks</h2>
          <div className="space-y-3">
            <IconCard
              icon={<Layers className={IconSize.HW5} />}
              title="Nested Tasks"
              description="Break down large tasks into subtasks by tapping a task and using the Add Subtask button. Subtasks can have their own subtasks, creating a hierarchical structure for complex projects."
              testId="card-nested-tasks"
            />
            <IconCard
              icon={<GripVertical className={IconSize.HW5} />}
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
            <IconCard
              icon={<Pin className={IconSize.HW5} />}
              title="Pinned"
              description="Pin important tasks to keep them at the top of your list."
              testId="card-pinned"
            />
            <IconCard
              icon={<PlayCircle className={IconSize.HW5} />}
              title="In Progress (if setting enabled)"
              description="Pins to the top of your list, while also accumulating time spent in progress."
              testId="card-in-progress"
            />
            <IconCard
              icon={<CheckCircle2 className={IconSize.HW5} />}
              title="Completed"
              description="Completed tasks are moved to a separate list you can access from the menu."
              testId="card-completed"
            />
          </div>
        </section>

        <section data-testid="section-additional">
          <h2 className="text-lg font-semibold mb-3 text-primary">Additional</h2>
          <div className="space-y-3">
            <Link href={Routes.SETTINGS} data-testid="link-settings">
              <IconCard
                className="hover-elevate cursor-pointer"
                icon={<Settings className={IconSize.HW5} />}
                title={
                  <span className="flex items-center gap-1">
                    Customize Your Experience
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </span>
                }
                description="Configure which rank fields are visible or required, toggle features like auto-pinning new tasks, In Progress status, time tracking, and more."
                testId="card-settings"
              />
            </Link>
          </div>
        </section>
      </div>

      {!isStandalone && (
        <Link href={Routes.HOW_TO_INSTALL} data-testid="link-how-to-install">
          <IconCard
            className="mt-8 hover-elevate cursor-pointer"
            icon={<Download className={IconSize.HW5} />}
            title={
              <span className="flex items-center gap-1">
                Install as App
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </span>
            }
            description={
              <>
                Add TaskRankr to your home screen for offline access and a
                full-screen experience.{' '}
                <span className="text-primary underline underline-offset-2">
                  See install instructions
                </span>
              </>
            }
            testId="card-how-to-install"
          />
        </Link>
      )}

      <ContactCard className="mt-4" />
    </ScrollablePage>
  )
}

export default HowToUse
