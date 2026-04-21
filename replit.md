# TaskRankr

## Overview
TaskRankr is a multi-user task management application designed for tracking tasks with detailed priority, ease, enjoyment, and time ratings. It supports hierarchical tasks, a status-based workflow (open, in_progress, pinned, completed), and offers a modern, dark-themed, mobile-first user interface. The application ensures per-user task isolation using Replit Auth and includes a guest mode for new users to explore its functionalities without an account. The core vision is to provide an intuitive and efficient task management solution that adapts to user preferences and optimizes productivity through flexible task ranking and organization.

## User Preferences
- Preferred communication style: Simple, everyday language.
- File naming: kebab-case for utility/helper files (e.g., `auth-utils.ts`), PascalCase for component primitives (e.g., `DropdownMenu.tsx`, `AlertDialog.tsx`), camelCase for hooks (e.g., `useSettings.ts`, `useTasks.ts`)
- Icon helper: Use `Icon` component from `LucideIcon.tsx` only for conditional/dynamic icons (ternary cases), not for single static icons
- JSDoc style: Keep descriptions concise (1-2 lines max), omit obvious info, use exact package names as imported (e.g., `@radix-ui` not "Radix UI")
- Terminology: "Rank fields" refers to the 4 sortable fields with badges: priority, ease, enjoyment, time (distinct from text fields like name/description)
- Test IDs: Use `data-testid` as the prop name, not `testId`
- Icon Sizing: Use `size-X` tailwind class instead of `w-X h-X`

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: Offline-first architecture using `LocalStateProvider` for immediate local updates and `SyncProvider` for background synchronization with the server. `GuestModeProvider` enables a full-featured guest experience with demo data.
- **Styling**: Tailwind CSS v4 with `@tailwindcss/vite` plugin, custom themes via `@theme` directive, and CSS variables.
- **UI Components**: shadcn/ui library (Radix UI primitives integrated with Tailwind).
- **Animations**: Framer Motion for interactive elements and transitions.

### Backend
- **Runtime**: Node.js with Express.
- **Language**: TypeScript (ES modules).
- **API**: RESTful API defined using ts-rest for end-to-end type safety with Zod schemas for validation.
- **Authentication**: Replit Auth (OpenID Connect).

### Data Management
- **Database**: PostgreSQL (Neon-backed).
- **ORM**: Drizzle ORM with drizzle-zod for schema definition and validation.
- **Data Model**:
    - **Tasks**: Include `name`, `description`, `priority`, `ease`, `enjoyment`, `time`, `parentId` (for nesting), `status` (open, in_progress, pinned, completed), `subtaskSortMode` (inherit, manual), `subtaskOrder`, `hidden` (boolean, prevents task from appearing in tree views), `autoHideCompleted` (boolean, auto-hides direct children when completed), `inheritCompletionState` (boolean, auto-completes parent when all children are completed, reverts to open when a non-completed subtask is added), and time tracking fields. Root tasks cannot be hidden; removing a hidden subtask from its parent auto-unhides it.
    - **User Settings**: Stored per-user, including `autoPinNewTasks`, `enableInProgressStatus`, `alwaysSortPinnedByPriority`, `sortBy`, and `fieldConfig` for customizable rank field visibility and requirements. `fieldConfig` covers the 4 rank fields (priority, ease, enjoyment, time) plus `timeSpent` (time tracking), each with `visible` and `required` flags.

### Key Features
- **Offline-First**: All data changes are applied locally first for an instant UI experience, then synchronized to the server in the background. A service worker (via `vite-plugin-pwa` / Workbox) precaches the app shell and caches Google Fonts, enabling the app to load even without an internet connection.
- **Guest Mode**: Allows users to try the app with persistent local storage and demo data without authentication. Guest task migration to user accounts upon login is supported.
- **Hierarchical Tasks**: Tasks can have `parentId` to create nested structures.
- **Configurable Rank Fields**: Priority, ease, enjoyment, and time fields have 6 levels and customizable visibility/required settings via `fieldConfig`.
- **Task Status System**: A clear workflow with `open`, `in_progress`, `pinned`, and `completed` statuses, including automatic demotion of `in_progress` tasks and time tracking.
- **Subtask Ordering**: Supports both inherited sorting from parent tasks and manual drag-and-drop reordering.
- **Changelog & Version Tracking**: A "What's New" dialog automatically appears when users open the app after an update with new changelog entries (new users without a last-seen version are silently marked as current and skip the dialog). Users can also view the full changelog from Settings. Version number is displayed at the bottom of Settings. Changelog content lives in `CHANGELOG.json` at the project root — add new entries at the top of the array. Logic and utilities are in `client/src/lib/changelog.ts`. **Before every publish, add a new changelog entry** to `CHANGELOG.json` summarizing what changed — bump the version, set today's date, give it a title, and list the changes. The entry at index 0 is always treated as the current version.
- **Sorting & Filtering Architecture**: All sorting and filtering logic lives in `client/src/lib/task-utils.ts`. `SORT_ORDER_MAP` defines tiebreaker chains per sort option. `sortTasks()` accepts a chain of `SortOption[]` fields. `RANK_FIELD_ENUMS` maps each rank field to its enum object; `RankFieldValueMap` and `RANK_FIELDS_COLUMNS` (display-order column metadata) are derived from it. `SORT_LABELS` and `SORT_DIRECTIONS` provide display names and ASC/DESC per field.
- **Task Hooks Architecture**: `useTasks.ts` exports data hooks (`useTasks`, `useTask`, `useTaskParentChain`) and `useTaskActions()` which returns direct calls to `LocalStateProvider` methods. All mutations are synchronous local-first operations — no `useMutation` wrappers or `isPending` states.

### Project Structure
```
├── client/               # React frontend
│   └── src/
│       ├── components/   # UI components
│       │   ├── primitives/       # Base UI components (shadcn/ui)
│       │   │   ├── forms/        # Form controls (Calendar, Checkbox, Form, Input, Label, Select, Switch, Textarea, TimeInput)
│       │   │   ├── overlays/     # AlertDialog, Dialog, Popover, Toast, Toaster, Tooltip
│       │   │   ├── Badge.tsx, Button.tsx, Card.tsx, CollapsibleCard.tsx, Toggle.tsx
│       │   │   ├── DropdownMenu.tsx, TagChain.tsx
│       │   │   ├── ScrollablePage.tsx  # Scrollable page wrapper for non-task-list pages
│       │   │   └── LucideIcon.tsx  # Dynamic icon helper
│       │   ├── appInfo/            # Informational/status components
│       │   │   ├── ContactCard.tsx   # Contact/email card with optional debug download
│       │   │   ├── HowToUseBanner.tsx  # Dismissible banner linking to How To Use page
│       │   │   ├── InstallBanner.tsx  # PWA install prompt banner
│       │   │   ├── SortInfo.tsx      # Reusable sort explanation component
│       │   │   ├── StatusBanner.tsx  # Auth/guest status banner
│       │   │   └── WhatsNewDialog.tsx  # Changelog dialog (auto-shows on new version) + settings button
│       │   ├── TaskForm/           # Task form and related components
│       │   │   ├── RankFieldSelect.tsx  # Select component for rank fields in task form
│       │   │   ├── TaskForm.tsx      # Full-screen task create/edit form
│       │   │   ├── TaskFormDialogProvider.tsx  # Context for task form dialog state
│       │   │   └── SubtasksCard/    # Subtask list with settings and drag-and-drop
│       │   │       ├── index.ts          # Barrel export
│       │   │       ├── SubtasksCard.tsx  # Main subtask list with DnD and hierarchy
│       │   │       ├── SubtasksSettings.tsx  # Subtask settings panel (sort, hide, etc.)
│       │   │       ├── SubtaskRowItem.tsx    # Individual subtask row with actions
│       │   │       ├── AssignSubtaskDialog.tsx  # Dialog to assign existing task as subtask
│       │   │       └── SubtaskActionDialog.tsx  # Cancel/Delete/Remove as Subtask dialog
│       │   ├── BackButton.tsx    # Back navigation button to home
│       │   ├── ErrorBoundary.tsx  # Global error boundary with red crash dialog
│       │   ├── DropdownMenuHeader.tsx  # Page header with hamburger menu, title + search
│       │   ├── PageStates.tsx    # Shared PageLoading, PageError, EmptyState
│       │   ├── SortButton.tsx    # Sort option toggle button
│       │   ├── TaskCard.tsx      # Task display with status indicators
│       │   ├── TaskListPage.tsx  # TaskListPageWrapper, TaskListPageHeader, TaskListTreeLayout
│       │   ├── ChangeStatusDialog.tsx  # Task status change modal
│       │   ├── ConfirmDeleteDialog.tsx  # Permanent delete confirmation dialog
│       │   └── SearchInput.tsx   # Reusable search input with icon
│       ├── hooks/
│       │   ├── useAuth.ts        # Authentication state hook
│       │   ├── useExpandedTasks.ts  # Task expansion state (persists in localStorage)
│       │   ├── useMobile.tsx     # Mobile detection hook
│       │   ├── useSettings.ts    # User settings with optimistic updates
│       │   ├── useTasks.ts       # Task data hooks (useTasks, useTask, useTaskParentChain) + useTaskActions
│       │   └── useToast.ts       # Toast notifications
│       ├── pages/
│       │   ├── Home.tsx          # Main task list with sorting
│       │   ├── Settings.tsx      # User preferences & attribute visibility
│       │   ├── Completed.tsx     # Completed tasks view
│       │   ├── HowToUse.tsx      # Instructional page (tap-to-edit, hold-for-status)
│       │   ├── HowToInstall.tsx  # PWA install instructions (iOS, Android, Desktop)
│       │   ├── Landing.tsx       # Unauthenticated landing page
│       │   └── NotFound.tsx
│       ├── providers/        # Context providers
│       │   ├── LocalStateProvider.tsx  # Local-first state + sync queue
│       │   ├── SyncProvider.tsx  # Background sync to API
│       │   ├── GuestModeProvider.tsx  # Guest mode flag (isGuestMode)
│       │   └── ExpandedTasksProvider.tsx  # Task expansion state persistence
│       ├── lib/
│       │   ├── task-utils.ts     # Sorting + filtering logic, SORT_ORDER_MAP, RANK_FIELDS_COLUMNS
│       │   ├── rank-field-styles.ts  # Rank field color mappings
│       │   ├── ts-rest.ts        # ts-rest client + QueryKeys
│       │   ├── query-client.ts   # @tanstack/react-query client
│       │   ├── utils.ts          # Utility functions (cn, time conversions, etc.)
│       │   ├── auth-utils.ts     # Authentication helpers
│       │   ├── changelog.ts      # Changelog entries, version tracking, unseen detection
│       │   ├── constants.ts      # DEFAULT_SETTINGS
│       │   ├── demo-tasks.ts     # Demo task data for guest mode
│       │   └── migrate-guest-tasks.ts  # Guest→auth task migration
│       ├── App.tsx               # Main app with routing and providers
│       └── main.tsx              # React entry point
├── server/
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API route handlers (ts-rest)
│   ├── storage.ts        # Database access layer
│   ├── db.ts             # Database connection
│   ├── static.ts         # Static file serving
│   ├── vite.ts           # Vite dev server integration
│   └── replit_integrations/auth/  # Replit Auth (OIDC)
│       ├── index.ts, replitAuth.ts, routes.ts, storage.ts
├── shared/
│   ├── schema/
│   │   ├── index.ts        # Re-exports from tasks.zod.ts, settings.zod.ts, and auth models
│   │   ├── tasks.zod.ts    # Task table, enums, rank fields, Zod schemas/types
│   │   └── settings.zod.ts # User settings table, fieldConfig, Zod schemas/types
│   ├── contract.ts       # ts-rest API contract
│   ├── constants.ts      # Auth path constants
│   └── models/
│       └── auth.ts       # Auth model utilities
└── migrations/           # Database migrations
```

## Shared Task Utilities (`shared/utils/task-utils.ts`)
Always prefer these over inline implementations:
- `getTaskById(allTasks, id)` — Find a task by ID. Returns `Task | undefined`.
- `getDirectSubtasks(allTasks, id)` — Get immediate children of a task.
- `updateTaskInList(allTasks, taskId, updater)` — Immutably update a single task in an array via an updater function. Use instead of `.map(t => t.id === id ? {...t, ...changes} : t)`.
- `getAllDescendantIds(allTasks, taskId)` — Get all nested descendant IDs (including the task itself) as a `Set<number>`. Useful for cascading operations like hide/delete.
- `getTaskStatuses(task)` — Returns `{ isInProgress, isPinned, isCompleted }` booleans.
- `getHasIncomplete(tasks)` — Whether any task in the array is not completed.
- `getHasIncompleteSubtasks(allTasks, taskId)` — Whether any direct subtask of the given task is not completed.
- `getChildrenLatestCompletedAt(children)` — Returns the most recent `completedAt` date among the given tasks, or `null`. Handles string-to-Date conversion.

## Coding Conventions

### Object copying
When copying many same-named properties from one object to another, use `omit` or `pick` from `es-toolkit` instead of enumerating every field by hand. Example: `createTask({ ...omit(draft, ['id', 'userId']), parentId: resolved })` rather than listing all 14 fields explicitly. Only enumerate when the field set is small (≤3) or every field needs a transformation.

## External Dependencies

### Database
- **PostgreSQL**: Main database for persistent storage.

### UI Libraries
- **Radix UI**: Provides unstyled, accessible UI components.
- **Framer Motion**: Used for declarative animations and gestures.
- **Lucide React**: Icon library.
- **React Day Picker**: Component for date selection.
- **CMDK**: Command palette interface.
- **Vaul**: Drawer component for React.

### PWA / Service Worker
- **vite-plugin-pwa**: Generates a Workbox-powered service worker that precaches the app shell and provides runtime caching for Google Fonts. Configured in `vite.config.ts` with `generateSW` strategy. Registration happens in `client/src/main.tsx` via `virtual:pwa-register`. The service worker checks for updates hourly. Type declarations for the virtual module are in `client/src/vite-env.d.ts`.

### Development Utilities
- **Vite**: Fast frontend build tool. Path aliases are resolved via `vite-tsconfig-paths` (reads from `tsconfig.json` paths).
- **esbuild**: Used for server-side bundling.
- **Drizzle Kit**: Tooling for database schema migrations.
- **TypeScript**: Ensures type safety across the entire codebase.
- **ts-rest**: Facilitates type-safe API contract definition and usage.
- **type-fest**: Provides various utility types for TypeScript.
