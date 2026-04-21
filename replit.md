# TaskRankr

## Overview
TaskRankr is a multi-user task management application designed for tracking tasks with detailed priority, ease, enjoyment, and time ratings. It supports hierarchical tasks, a status-based workflow (open, in_progress, pinned, completed), and offers a modern, dark-themed, mobile-first user interface. The application ensures per-user task isolation using Replit Auth and includes a guest mode for new users to explore its functionalities without an account. The core vision is to provide an intuitive and efficient task management solution that adapts to user preferences and optimizes productivity through flexible task ranking and organization.

## User Preferences
- Preferred communication style: Simple, everyday language.
- File naming: kebab-case for utility/helper files (e.g., `auth-utils.ts`), PascalCase for component primitives (e.g., `DropdownMenu.tsx`, `AlertDialog.tsx`), camelCase for hooks (e.g., `useAuth.ts`, `useSettings.ts`)
- Icon helper: Use `Icon` component from `LucideIcon.tsx` only for conditional/dynamic icons (ternary cases), not for single static icons
- JSDoc style: Keep descriptions concise (1-2 lines max), omit obvious info, use exact package names as imported (e.g., `@radix-ui` not "Radix UI")
- Terminology: "Rank fields" refers to the 4 sortable fields with badges: priority, ease, enjoyment, time (distinct from text fields like name/description)
- Test IDs: Use `data-testid` as the prop name, not `testId`
- Icon Sizing: Use `size-X` tailwind class instead of `w-X h-X`
- Formatting: Run `npm run format` (biome) before every commit/checkpoint so the code in checkpoints is always formatted. Biome config in `biome.jsonc` excludes `.cache`, `.config`, `.local`, `node_modules`, `coverage`, `dist`, and `dev-dist`.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: Offline-first architecture split across focused providers — `SettingsProvider` owns user settings, `TaskSyncQueueProvider` owns the task sync queue (append-only log of operations bound for the server), `TasksProvider` owns tasks and pushes onto that queue, `SyncProvider` orchestrates background synchronization to the server, and `DraftSessionProvider` (scoped to the TaskForm dialog subtree) owns the in-memory draft session. `GuestModeProvider` enables a full-featured guest experience with demo data. Each domain provider exposes its own context so consumers only re-render when their slice changes.
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
- **Sorting & Filtering Architecture**: Sort/filter logic and tree-walking primitives live in `client/src/lib/task-tree-utils.ts` (which also re-exports `~/shared/utils/task-utils`). `SORT_ORDER_MAP` defines tiebreaker chains per sort option, `sortTasks()` accepts a chain of `SortOption[]` fields, and `SORT_DIRECTIONS` provides ASC/DESC per field. UI display metadata for rank columns — `SORT_LABELS` and `RANK_FIELDS_COLUMNS` (display-order column metadata) — lives in `client/src/lib/columns.ts`. The rank-field enum map (`RANK_FIELD_ENUMS`) and the derived `RankFieldValueMap` type live in `client/src/lib/constants.ts` alongside other app-wide constants.
- **Task Cascade Helpers**: `collectSubtreeIds(tasks, rootIds, { includeRoots? })` is the shared BFS-descendants primitive in `client/src/lib/task-tree-utils.ts`, used at three sites in `TasksProvider` (the reconcile loop, `setTaskStatus`'s COMPLETED+hidden branch, and `updateTask`'s `autoHideCompleted` branch). The two TasksProvider-specific cascade functions — `reconcileInheritCompletionState(tasks)` (auto-completes/reverts parents with `inheritCompletionState` and cascades `hidden: true` when the grandparent has `autoHideCompleted`) and `topoSortForRecovery(orphaned, taskById, recoverableIds)` (orders negative-id creates during orphan recovery) — live as private functions in `TasksProvider.tsx` since they have a single caller and are tightly coupled to provider state.
- **App State & Mutations**: `TasksProvider` exposes two separate contexts for re-render isolation: `useTasks()` returns `{ tasks, hasDemoData }` (changes on every task mutation) and `useTaskMutations()` returns the stable mutator/server-bridge callbacks plus `isInitialized` (`createTask`, `updateTask`, `setTaskStatus`, `deleteTask`, `reorderSubtasks`, `deleteDemoData`, `replaceTaskId`, `setTasksFromServer`, `subscribeToIdReplacement`). `isInitialized` lives on the mutations context so consumers that only need the init flag (like `SyncProvider`) don't subscribe to the task array. Components that only fire mutations (e.g. `TaskCard`, `SubtasksSettings`, `TaskFormDialogProvider`) subscribe to `useTaskMutations()` and do NOT re-render on task list changes; components that render task data (e.g. `Home`, `Completed`) subscribe to `useTasks()`. Settings come from `useSettings()` (`const { settings, updateSettings } = useSettings()`). All mutations are synchronous local-first writes (no `useMutation`, no `isPending`); `SyncProvider` reconciles to the server in the background. Loading state is `!isInitialized` (aggregated across providers). Provider order in `App.tsx`: `SettingsProvider > TaskSyncQueueProvider > TasksProvider > SyncProvider > ExpandedTasksProvider > TaskFormDialogProvider`. `TasksProvider` reads `settings.autoPinNewTasks` in `createTask` and calls `useTaskSyncQueue().enqueue(...)` from every mutator; SyncProvider drains the queue. The queue is in its own provider specifically so queue mutations (every task change + every flush tick) don't re-render task consumers — only SyncProvider subscribes. `TaskFormDialogProvider` internally mounts `DraftSessionProvider` around its inner implementation so draft state is scoped to the dialog subtree without App.tsx having to know about it.
- **Settings Sync Model**: Task mutations push individual operations onto the persistent append-only sync queue in `TaskSyncQueueProvider`. Settings updates instead use a single coalesced `pendingSettingsSync: Partial<UserSettings> | null` — because settings updates are idempotent partial merges, queueing multiple toggles of the same field would be wasteful. `SyncProvider` snapshots the pending pointer at flush start, sends it, then calls `acknowledgeSettingsSync(snapshot)` which only drops fields whose current value still matches what was sent — fields the user changed mid-flight are retained for the next flush. Both the task queue and the pending settings pointer are persisted to localStorage so unsynced changes survive a tab close. After a CREATE_TASK succeeds, `TasksProvider.replaceTaskId` updates both the tasks list (its own state) and the queue (via `TaskSyncQueueProvider.replaceTempIdInQueue`) so in-flight references to the temp id get rewritten to the real id. Orphan recovery (negative-id tasks in storage whose CREATE op is missing from the queue) runs once in `TasksProvider`'s init effect and appends recovery CREATE ops via `enqueueMany`.
- **Settings Invariants**: `SettingsProvider` normalizes settings (`normalizeSettings` = merge with `DEFAULT_SETTINGS` + `sanitizeSettings`) at every write boundary — initial localStorage load, `setSettingsFromServer`, and `updateSettings`. The fieldConfig invariant (`required` is always false when `visible` is false) is enforced at the storage layer, not at the consumer, so any code reading `settings` can trust it without re-sanitizing. `DEFAULT_SETTINGS` lives in `SettingsProvider.tsx` itself, not in `lib/constants.ts`.
- **localStorage Conventions**: All per-user persistent state goes through `client/src/lib/storage.ts`, which exports `StorageMode` (`AUTH` / `GUEST`), `getStorageKeys(mode)` (returns the namespaced key set: `tasks`, `settings`, `nextId`, `syncQueue`, `demoTaskIds`, `expanded`), and a `storage` helper (`get<T>(key, fallback)`, `set(key, value)`, `remove(key)`) that wraps the JSON.stringify/parse boilerplate. Providers should never call `localStorage.*` directly. The pending-settings-sync key is derived as `${storageKeys.settings}-pending-sync`.
- **Draft Sessions (Parent-Task Create Flow)**: Draft session state lives in `DraftSessionProvider`, mounted internally by `TaskFormDialogProvider` (so the dialog subtree is the *only* consumer and draft churn — keystrokes, subtask adds, drag-reorders — never re-renders `Home` or other top-level task-list consumers of `useTasks()`). Consumers inside the dialog call `useDraftSession()` for `tasksWithDrafts`, `updateTask`, `deleteTask`, `reorderSubtasks`, `setTaskStatus`, and the session lifecycle (`createDraftTask`, `assignDraftSubtask`, `commitDraftSession`, `discardDraftSession`, `hasDraftSession`, `draftTaskIds`, `draftAssignmentCount`, `isDraftId`). The draft-aware mutators route by `isDraftId(id)` — drafts stay in memory, real ids fall through to the underlying `TasksProvider` mutator. Three in-memory layers are tracked for the session: `draftTasks` (new tasks with very-negative temp ids), `draftAssignedParents` (real-task id → draft parent id), and `draftSubtaskOrderOverrides` (real-parent id → subtaskOrder). `tasksWithDrafts` overlays these on top of `TasksProvider.tasks` for the dialog UI. On Save, `commitDraftSession` promotes drafts in dependency order — it builds an idMap from draft ids to freshly minted real ids via `createTask`, then applies MANUAL reorders and parent reassignments through the *real* TasksProvider mutators (which are draft-unaware after the split, so there's no re-parking risk and no need for a "direct bypass"). On Cancel, `discardDraftSession` drops all three layers. `TasksProvider.tasks` and its mutators are strictly real-only; no draft code leaks into app-wide state.


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
│       │   │   ├── TaskForm.tsx      # Full-screen task create/edit form (uses `key={formKey}` from provider to remount between fresh-create sessions; also self-resets via useEffect on `initialData` change)
│       │   │   ├── TaskFormDialogProvider.tsx  # Dialog state + nav stack (parent ↔ subtask navigation), owns draft-session lifecycle: opens session on create/edit, commits on Save, shows cancel-confirm with `pendingSubtaskCount` when draft work would be lost, then discards on confirm
│       │   │   ├── useTaskFormParentChain.ts  # Breadcrumb-style parent chain walker over `tasksWithDrafts` (dialog-scoped)
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
│       │   ├── SettingsProvider.tsx  # User settings + coalesced pending settings sync
│       │   ├── TaskSyncQueueProvider.tsx  # Task sync queue (owns SyncOperation types) — isolated from task re-renders
│       │   ├── TasksProvider.tsx  # Local-first task state; enqueues onto TaskSyncQueueProvider
│       │   ├── SyncProvider.tsx  # Background sync orchestrator (drains task queue + Settings pending)
│       │   ├── GuestModeProvider.tsx  # Guest mode flag (isGuestMode)
│       │   └── ExpandedTasksProvider.tsx  # Task expansion state persistence
│       ├── lib/
│       │   ├── task-tree-utils.ts # Tree-walking helpers (getById, collectSubtreeIds, ...) + sort/filter logic, SORT_ORDER_MAP
│       │   ├── columns.ts        # Rank-column UI metadata: SORT_LABELS, RANK_FIELDS_COLUMNS
│       │   ├── rank-field-styles.ts  # Rank field color mappings
│       │   ├── ts-rest.ts        # ts-rest client + QueryKeys
│       │   ├── query-client.ts   # @tanstack/react-query client
│       │   ├── utils.ts          # Utility functions (cn, time conversions, etc.)
│       │   ├── auth-utils.ts     # Authentication helpers
│       │   ├── changelog.ts      # Changelog entries, version tracking, unseen detection
│       │   ├── constants.ts      # App-wide constants (Routes, date formats, RANK_FIELD_ENUMS, RankFieldValueMap)
│       │   ├── storage.ts        # localStorage key namespaces (StorageMode, getStorageKeys) + JSON storage helper
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
