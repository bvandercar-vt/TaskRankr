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
import { CardSection } from '@/components/primitives/CardSection'
import { IconCard } from '@/components/primitives/IconCard'
import { ScrollablePage } from '@/components/primitives/ScrollablePage'
import { SortInfo } from '@/components/SortInfo'
import { IconSize, Routes } from '@/lib/constants'
import { cn } from '@/lib/utils'

const HowToUse = () => {
  const isStandalone = isStandalonePWA()

  return (
    <ScrollablePage className="pb-16">
      <BackButtonHeader title="How To Use" />

      <div className="space-y-6">
        <CardSection
          title="Working with Tasks"
          data-testid="section-working-with-tasks"
        >
          <IconCard
            icon={<MousePointer2 className={IconSize.HW5} />}
            title="Tap to Edit"
            description="Tap a task to edit it, where you can change the name, description, and rank fields like priority, ease, enjoyment, and time, as well as create nested subtasks to assist with breaking down projects."
            data-testid="card-tap-to-edit"
          />
          <IconCard
            icon={<Hand className={IconSize.HW5} />}
            title="Hold to Change Status"
            description="Press and hold a task to open the status menu. From there you can mark it as Pinned, In Progress (if setting enabled), Completed, or Delete it."
            data-testid="card-hold-to-change-status"
          />
        </CardSection>

        <CardSection title="Sorting Tasks" data-testid="section-sorting">
          <IconCard
            icon={<ArrowUpDown className={IconSize.HW5} />}
            title="Sort Options"
            description={
              <>
                <div className="mb-4">
                  Use the sort buttons at the top of the task list to order
                  tasks by date created, priority, ease, enjoyment, or time. You
                  can customize which rank fields are visible in Settings.
                </div>
                <SortInfo defaultExpanded={false} />
              </>
            }
            data-testid="card-sorting"
          />
        </CardSection>

        <CardSection title="Subtasks" data-testid="section-subtasks">
          <IconCard
            icon={<Layers className={IconSize.HW5} />}
            title="Nested Tasks"
            description="Break down large tasks into subtasks by tapping a task and using the Add Subtask button. Subtasks can have their own subtasks, creating a hierarchical structure for complex projects."
            data-testid="card-nested-tasks"
          />
          <IconCard
            icon={<GripVertical className={IconSize.HW5} />}
            title="Manual Ordering"
            description="By default, subtasks follow the same sort order as the main list. Toggle Manual mode in the subtasks panel to drag and reorder subtasks in a custom sequence, perfect for step-by-step workflows."
            data-testid="card-manual-ordering"
          />
        </CardSection>

        <CardSection title="Task Statuses" data-testid="section-task-statuses">
          <IconCard
            icon={<Pin className={IconSize.HW5} />}
            title="Pinned"
            description="Pin important tasks to keep them at the top of your list."
            data-testid="card-pinned"
          />
          <IconCard
            icon={<PlayCircle className={IconSize.HW5} />}
            title="In Progress (if setting enabled)"
            description="Pins to the top of your list, while also accumulating time spent in progress."
            data-testid="card-in-progress"
          />
          <IconCard
            icon={<CheckCircle2 className={IconSize.HW5} />}
            title="Completed"
            description="Completed tasks are moved to a separate list you can access from the menu."
            data-testid="card-completed"
          />
        </CardSection>

        <CardSection title="Additional" data-testid="section-additional">
          <Link href={Routes.SETTINGS} data-testid="link-settings">
            <IconCard
              className="hover-elevate cursor-pointer"
              icon={<Settings className={IconSize.HW5} />}
              title="Customize Your Experience"
              titleRightIcon={
                <ChevronRight
                  className={cn(IconSize.HW4, 'text-muted-foreground')}
                />
              }
              description="Configure which rank fields are visible or required, toggle features like auto-pinning new tasks, In Progress status, time tracking, and more."
              data-testid="card-settings"
            />
          </Link>
          {!isStandalone && (
            <Link
              href={Routes.HOW_TO_INSTALL}
              data-testid="link-how-to-install"
            >
              <IconCard
                className="hover-elevate cursor-pointer"
                icon={<Download className={IconSize.HW5} />}
                title="Install as App"
                titleRightIcon={
                  <ChevronRight
                    className={cn(IconSize.HW4, 'text-muted-foreground')}
                  />
                }
                description="Add TaskRankr to your home screen for offline access and a full-screen experience."
                data-testid="card-how-to-install"
              />
            </Link>
          )}
          <ContactCard />
        </CardSection>
      </div>
    </ScrollablePage>
  )
}

export default HowToUse
