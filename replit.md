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

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: Offline-first architecture using `LocalStateProvider` for immediate local updates and `SyncProvider` for background synchronization with the server. `GuestModeProvider` enables a full-featured guest experience with demo data.
- **Styling**: Tailwind CSS with custom themes and CSS variables.
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
    - **Tasks**: Include `name`, `description`, `priority`, `ease`, `enjoyment`, `time`, `parentId` (for nesting), `status` (open, in_progress, pinned, completed), `subtaskSortMode` (inherit, manual), `subtaskOrder`, and time tracking fields.
    - **User Settings**: Stored per-user, including `autoPinNewTasks`, `enableInProgressStatus`, `enableInProgressTime`, `alwaysSortPinnedByPriority`, `sortBy`, and `fieldConfig` for customizable rank field visibility and requirements.

### Key Features
- **Offline-First**: All data changes are applied locally first for an instant UI experience, then synchronized to the server in the background.
- **Guest Mode**: Allows users to try the app with persistent local storage and demo data without authentication. Guest task migration to user accounts upon login is supported.
- **Hierarchical Tasks**: Tasks can have `parentId` to create nested structures.
- **Configurable Rank Fields**: Priority, ease, enjoyment, and time fields have 6 levels and customizable visibility/required settings via `fieldConfig`.
- **Task Status System**: A clear workflow with `open`, `in_progress`, `pinned`, and `completed` statuses, including automatic demotion of `in_progress` tasks and time tracking.
- **Subtask Ordering**: Supports both inherited sorting from parent tasks and manual drag-and-drop reordering.
- **Sorting & Filtering Architecture**: All sorting and filtering logic lives in `client/src/lib/sort-tasks.ts`. `SORT_ORDER_MAP` defines tiebreaker chains per sort option. `sortTasks()` accepts a chain of `SortOption[]` fields. `RANK_FIELD_ENUMS` maps each rank field to its enum object; `RankFieldValueMap` and `RANK_FIELDS_COLUMNS` (display-order column metadata) are derived from it. `SORT_LABELS` and `SORT_DIRECTIONS` provide display names and ASC/DESC per field.
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
│       │   ├── BackButton.tsx    # Back navigation button to home
│       │   ├── ContactCard.tsx   # Contact/email card
│       │   ├── HowToUseBanner.tsx  # Dismissible banner linking to How To Use page
│       │   ├── DropdownMenuHeader.tsx  # Page header with hamburger menu, title + search
│       │   ├── PageStates.tsx    # Shared PageLoading, PageError, EmptyState
│       │   ├── providers/        # Context providers
│       │   │   ├── LocalStateProvider.tsx  # Local-first state + sync queue
│       │   │   ├── SyncProvider.tsx  # Background sync to API
│       │   │   ├── GuestModeProvider.tsx  # Guest mode flag (isGuestMode)
│       │   │   ├── ExpandedTasksProvider.tsx  # Task expansion state persistence
│       │   │   └── TaskFormDialogProvider.tsx  # Context for task form dialog state
│       │   ├── RankFieldSelect.tsx  # Select component for rank fields in task form
│       │   ├── SortButton.tsx    # Sort option toggle button
│       │   ├── StatusBanner.tsx  # Auth/guest status banner
│       │   ├── SubtasksCard.tsx  # Subtask list with drag-and-drop and assign
│       │   ├── TaskCard.tsx      # Task display with status indicators
│       │   ├── TaskForm.tsx      # Full-screen task create/edit form
│       │   ├── TaskListPage.tsx  # TaskListPageWrapper, TaskListPageHeader, TaskListTreeLayout
│       │   ├── ChangeStatusDialog.tsx  # Task status change modal
│       │   ├── ConfirmDeleteDialog.tsx  # Permanent delete confirmation dialog
│       │   ├── SubtaskActionDialog.tsx  # Cancel/Delete/Remove as Subtask dialog
│       │   ├── AssignSubtaskDialog.tsx  # Dialog to assign existing task as subtask
│       │   ├── SearchInput.tsx   # Reusable search input with icon
│       │   └── SortInfo.tsx      # Reusable sort explanation component
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
│       │   ├── Landing.tsx       # Unauthenticated landing page
│       │   └── NotFound.tsx
│       ├── lib/
│       │   ├── sort-tasks.ts     # Sorting + filtering logic, SORT_ORDER_MAP, RANK_FIELDS_COLUMNS
│       │   ├── rank-field-styles.ts  # Rank field color mappings
│       │   ├── ts-rest.ts        # ts-rest client + QueryKeys
│       │   ├── query-client.ts   # @tanstack/react-query client
│       │   ├── utils.ts          # Utility functions (cn, time conversions, etc.)
│       │   ├── auth-utils.ts     # Authentication helpers
│       │   ├── constants.ts      # IconSize, DEFAULT_SETTINGS
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

### Development Utilities
- **Vite**: Fast frontend build tool.
- **esbuild**: Used for server-side bundling.
- **Drizzle Kit**: Tooling for database schema migrations.
- **TypeScript**: Ensures type safety across the entire codebase.
- **ts-rest**: Facilitates type-safe API contract definition and usage.
- **type-fest**: Provides various utility types for TypeScript.
