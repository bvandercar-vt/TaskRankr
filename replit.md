# TaskRankr

## Overview

TaskRankr is a multi-user task management application that lets you track tasks with priority, ease, enjoyment, and time ratings. Each rank field has 6 levels (including "none") with configurable visibility and required settings. Features hierarchical/nested task support, status-based workflow, a modern dark-themed mobile-first UI, per-user task isolation with Replit Auth, and a guest mode for trying the app without an account.

## User Preferences

- Preferred communication style: Simple, everyday language.
- File naming: kebab-case for utility/helper files (e.g., `page-states.tsx`), PascalCase for component primitives (e.g., `DropdownMenu.tsx`, `AlertDialog.tsx`), camelCase for hooks (e.g., `useSettings.ts`, `useTasks.ts`)
- Icon helper: Use `Icon` component from `LucideIcon.tsx` only for conditional/dynamic icons (ternary cases), not for single static icons
- JSDoc style: Keep descriptions concise (1-2 lines max), omit obvious info, use exact package names as imported (e.g., `@radix-ui` not "Radix UI")
- Terminology: "Rank fields" refers to the 4 sortable fields with badges: priority, ease, enjoyment, time (distinct from text fields like name/description)
- Test IDs: Use `data-testid` as the prop name, not `testId`

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: Offline-first architecture with LocalStateProvider + SyncProvider
- **Styling**: Tailwind CSS with custom theme configuration, CSS variables for theming
- **UI Components**: shadcn/ui component library (Radix UI primitives + Tailwind)
- **Animations**: Framer Motion for list reordering and transitions
- **Build Tool**: Vite with React plugin

### Offline-First Architecture
The app uses a local-first data model where all changes happen locally first, then sync to the server:

- **LocalStateProvider** (`client/src/components/LocalStateProvider.tsx`):
  - Manages tasks and settings in localStorage
  - Uses separate localStorage namespaces: `taskrankr-auth-*` for authenticated, `taskrankr-guest-*` for guest mode
  - All CRUD operations update local state immediately
  - Enqueues sync operations when `shouldSync` is true (authenticated mode)
  - Uses negative temp IDs for locally-created tasks until synced

- **SyncProvider** (`client/src/components/SyncProvider.tsx`):
  - Processes sync queue in background when online and authenticated
  - Maintains idMap to resolve temp IDs to real server IDs during batch processing
  - Fetches server data on auth (waits for queue to drain first)
  - Shows offline/syncing status via StatusBanner

- **GuestModeProvider** (`client/src/components/GuestModeProvider.tsx`):
  - Simple flag for guest mode (`isGuestMode`)
  - When in guest mode: uses LocalStateProvider with `shouldSync=false`
  - Demo data (sample tasks) created on first entry to help users learn the app
  - "Delete Demo Data" button available to remove sample tasks
  - All features work in guest mode, data persists in localStorage

- **Guest Task Migration** (`client/src/lib/migrate-guest-tasks.ts`):
  - On login, migrates guest tasks (excluding demo tasks) to authenticated storage
  - Filters out demo tasks by tracking their IDs separately
  - Clears guest storage after successful migration

- **Data Flow**:
  1. User action → LocalStateProvider updates local state + enqueues sync op
  2. SyncProvider debounces (500ms) then processes queue
  3. For creates: temp ID replaced with real ID in both local state and pending ops
  4. UI always reads from local state (instant updates)

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ES modules)
- **API Pattern**: RESTful API using ts-rest for end-to-end type safety
- **API Contract**: `shared/contract.ts` - defines all endpoints with Zod schemas
- **Validation**: Automatic validation via ts-rest using Zod schemas
- **Authentication**: Replit Auth (OpenID Connect)

### Data Storage
- **Database**: PostgreSQL (Neon-backed)
- **ORM**: Drizzle ORM with drizzle-zod for schema-to-validation integration
- **Schema Location**: `shared/schema.ts` - defines tasks and user_settings tables
- **Migrations**: Drizzle Kit for schema migrations (`drizzle-kit push`)

### Project Structure
```
├── client/               # React frontend
│   └── src/
│       ├── components/   # UI components
│       │   ├── primitives/       # Base UI components (shadcn/ui)
│       │   │   ├── forms/        # Form controls (Calendar, Checkbox, Form, Input, Label, Select, Switch, Textarea)
│       │   │   ├── overlays/     # AlertDialog, Dialog, Popover, Toast, Toaster, Tooltip
│       │   │   ├── Badge.tsx, Button.tsx, Card.tsx, Toggle.tsx
│       │   │   ├── DropdownMenu.tsx, TagChain.tsx
│       │   │   └── LucideIcon.tsx  # Dynamic icon helper
│       │   ├── PageStates.tsx    # Shared PageLoading, PageError, EmptyState
│       │   ├── LocalStateProvider.tsx  # Local-first state + sync queue
│       │   ├── SyncProvider.tsx  # Background sync to API
│       │   ├── GuestModeProvider.tsx  # Guest mode flag (isGuestMode)
│       │   ├── TaskCard.tsx      # Task display with status indicators
│       │   ├── TaskForm.tsx      # Full-screen task create/edit form
│       │   ├── TaskDialogProvider.tsx  # Context for task dialog state
│       │   ├── ChangeStatusDialog.tsx  # Task status change modal
│       │   ├── ConfirmDeleteDialog.tsx
│       │   └── SortInfo.tsx      # Reusable sort explanation component
│       ├── hooks/
│       │   ├── useAuth.ts        # Authentication state hook
│       │   ├── useGuestModeState.ts  # Guest mode localStorage state
│       │   ├── useMobile.tsx     # Mobile detection hook
│       │   ├── useSettings.ts    # User settings with optimistic updates
│       │   ├── useTasks.ts       # Task CRUD operations
│       │   └── useToast.ts       # Toast notifications
│       ├── pages/
│       │   ├── Home.tsx          # Main task list with sorting
│       │   ├── Settings.tsx      # User preferences & attribute visibility
│       │   ├── Completed.tsx     # Completed tasks view
│       │   ├── HowToUse.tsx      # Instructional page (tap-to-edit, hold-for-status)
│       │   ├── Landing.tsx       # Unauthenticated landing page
│       │   └── NotFound.tsx
│       ├── lib/
│       │   ├── ts-rest.ts        # ts-rest client + QueryKeys
│       │   ├── query-client.ts   # @tanstack/react-query client
│       │   ├── utils.ts          # Utility functions (cn, time conversions, etc.)
│       │   ├── rank-field-styles.ts  # Rank field color mappings
│       │   ├── auth-utils.ts     # Authentication helpers
│       │   ├── constants.ts      # IconSizeStyle, DEFAULT_SETTINGS
│       │   ├── demo-tasks.ts     # Demo task data for guest mode
│       │   └── migrate-guest-tasks.ts  # Guest→auth task migration
│       ├── types/
│       │   └── index.ts          # Frontend-specific types
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
│   ├── schema.ts         # Drizzle schema + Zod types + RANK_FIELDS_CRITERIA
│   ├── contract.ts       # ts-rest API contract
│   ├── constants.ts      # Auth path constants
│   └── models/
│       └── auth.ts       # Auth model utilities
└── migrations/           # Database migrations
```

### API Design (ts-rest)
API is defined using ts-rest contract in `shared/contract.ts`:
- Type-safe endpoints with automatic request/response validation
- Client and server share the same contract for end-to-end type safety
- Server implementation in `server/routes.ts` using `@ts-rest/express`
- Client in `client/src/lib/ts-rest.ts` using `@ts-rest/react-query`
- DELETE endpoints use `c.noBody()` not `z.undefined()` for empty request bodies

Key endpoints:
- `GET /api/tasks` - List all tasks (user-scoped)
- `GET /api/tasks/:id` - Get single task
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `PUT /api/tasks/:id/status` - Set task status (handles time tracking and auto-demotion)
- `DELETE /api/tasks/:id` - Delete task
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update user settings

### Task Data Model
Tasks have:
- `name`, `description` (text fields)
- `priority` (enum: none/lowest/low/medium/high/highest)
- `ease` (enum: none/easiest/easy/medium/hard/hardest)
- `enjoyment` (enum: none/lowest/low/medium/high/highest)
- `time` (enum: none/lowest/low/medium/high/highest)
- `parentId` (nullable, for nested task hierarchy)
- `status` (enum: open/in_progress/pinned/completed)
- `inProgressTime` (integer) - cumulative milliseconds spent in "in progress" state
- `inProgressStartedAt` (timestamp) - when the current in-progress session started
- `createdAt`, `completedAt` (timestamps)
- `userId` (string) - owner of the task

### User Settings Model
Per-user settings stored in `user_settings` table:
- `autoPinNewTasks` - Auto-pin newly created tasks
- `enableInProgressStatus` - Allow tasks to be marked "In Progress" (when disabled, demotes any in_progress task to pinned)
- `enableInProgressTime` - Track time spent on in-progress tasks (only visible when enableInProgressStatus is true)
- `alwaysSortPinnedByPriority` - Sort pinned tasks by priority first
- `sortBy` - Current sort preference (date/priority/ease/enjoyment/time)
- `{attribute}Visible` - Whether each attribute column is shown
- `{attribute}Required` - Whether each attribute must be set on task creation

### Settings Hook Pattern
Always use `useSettings()` hook for reading/updating settings in React components:
- **`useSettings()`** - Reactive hook from LocalStateProvider. Works for both guest and authenticated modes. Re-renders on changes.
- **`getIsVisible(field, settings)`** / **`getIsRequired(field, settings)`** - Helper functions for rank field visibility/required checks.

### Task Status System
- **open**: Default state for new tasks
- **in_progress**: Task being actively worked on (only ONE task can be in_progress at a time)
- **pinned**: Hoisted to top of list (multiple allowed, displayed below in_progress)
- **completed**: Task finished

Status behaviors:
- Setting a task to in_progress auto-demotes the current in_progress task to pinned
- Pinned tasks are hoisted at the top of the list, below the in_progress task
- Time accumulates when in in_progress status, not when pinned
- Long-press (800ms) opens the Task Status dialog for status changes
- Visual indicators: blue border for in_progress, slate blue-gray border + pin icon for pinned

### Shared Utilities
- `RANK_FIELDS_CRITERIA` in `shared/schema.ts` - Central config for rank fields (name, label, levels, colors)
- `getIsVisible(field, settings)` / `getIsRequired(field, settings)` - Type-safe settings access
- `PickByKey<T, Matcher>` - Type utility for selecting keys matching a pattern

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable

### UI Libraries
- **Radix UI**: Headless UI primitives (dialogs, dropdowns, forms, etc.)
- **Framer Motion**: Animation library
- **Lucide React**: Icon library
- **React Day Picker**: Calendar/date picker
- **CMDK**: Command palette component
- **Vaul**: Drawer component

### Development Tools
- **Vite**: Frontend build tool with HMR
- **esbuild**: Server bundling for production
- **Drizzle Kit**: Database migration tool
- **TypeScript**: Type checking across the stack
- **ts-rest**: Type-safe REST API framework (@ts-rest/core, @ts-rest/express, @ts-rest/react-query)
- **type-fest**: Advanced TypeScript utilities (Simplify, etc.)
