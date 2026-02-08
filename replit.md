# TaskRankr

## Overview

TaskRankr is a multi-user task management application designed for tracking tasks with customizable priority, ease, enjoyment, and time ratings. It supports hierarchical task structures, a status-based workflow, and features a modern dark-themed, mobile-first user interface. The application ensures per-user task isolation using Replit Auth and includes a guest mode for new users to explore its functionalities without an account. Its core purpose is to provide an intuitive and efficient way for users to manage their tasks effectively, offering flexibility in how tasks are organized and prioritized.

## User Preferences

- Preferred communication style: Simple, everyday language.
- File naming: kebab-case for utility/helper files (e.g., `auth-utils.ts`), PascalCase for component primitives (e.g., `DropdownMenu.tsx`, `AlertDialog.tsx`), camelCase for hooks (e.g., `useSettings.ts`, `useTasks.ts`)
- Icon helper: Use `Icon` component from `LucideIcon.tsx` only for conditional/dynamic icons (ternary cases), not for single static icons
- JSDoc style: Keep descriptions concise (1-2 lines max), omit obvious info, use exact package names as imported (e.g., `@radix-ui` not "Radix UI")
- Terminology: "Rank fields" refers to the 4 sortable fields with badges: priority, ease, enjoyment, time (distinct from text fields like name/description)
- Test IDs: Use `data-testid` as the prop name, not `testId`

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: Offline-first architecture using `LocalStateProvider` for local changes and `SyncProvider` for server synchronization. Includes a `GuestModeProvider` for unauthenticated use with demo data and guest task migration upon login.
- **Styling**: Tailwind CSS with custom themes and CSS variables
- **UI Components**: shadcn/ui (Radix UI primitives + Tailwind)
- **Animations**: Framer Motion
- **Build Tool**: Vite

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript
- **API Pattern**: RESTful API with `ts-rest` for end-to-end type safety using Zod schemas for validation.
- **Authentication**: Replit Auth (OpenID Connect)

### Data Storage
- **Database**: PostgreSQL (Neon-backed)
- **ORM**: Drizzle ORM with `drizzle-zod` for schema integration. Migrations handled by Drizzle Kit.

### Core Features & Design Patterns
- **Offline-First Data Model**: All data modifications occur locally first, then asynchronously sync with the server. Temporary IDs are used for new local entities until server synchronization.
- **Task Data Model**: Tasks include `name`, `description`, four configurable rank fields (`priority`, `ease`, `enjoyment`, `time`), `parentId` for nesting, `status` (open, in_progress, pinned, completed), `subtaskSortMode` (inherit/manual) with `subtaskOrder` array for manual reordering, `inProgressTime` tracking, and timestamps.
- **User Settings Model**: Per-user settings manage `autoPinNewTasks`, `enableInProgressStatus`, `enableInProgressTime`, `alwaysSortPinnedByPriority`, `sortBy` preference, and a `fieldConfig` (JSONB) for visibility and required status of rank fields. Settings are accessed via a `useSettings()` hook for reactivity.
- **Task Status System**: Defines a workflow with `open`, `in_progress`, `pinned`, and `completed` statuses. Only one task can be `in_progress` at a time, with automatic demotion of previous `in_progress` tasks to `pinned`. Pinned tasks are visually prioritized. Time tracking is enabled for `in_progress` tasks.
- **Sorting Architecture**: All sorting logic lives in `client/src/lib/sort-tasks.ts`. `SORT_ORDER_MAP` defines tiebreaker chains per sort option (e.g., sorting by priority falls back to ease, then enjoyment). `sortTasks()` accepts a chain of `SortOption[]` fields. `RANK_FIELD_ENUMS` maps each rank field to its enum object; `RankFieldValueMap` and `RANK_FIELDS_COLUMNS` (display-order column metadata) are derived from it. `SORT_LABELS` and `SORT_DIRECTIONS` provide display names and ASC/DESC per field. `SortInfo.tsx` derives its config entirely from these constants.

### Key Modules
- **`client/src/lib/sort-tasks.ts`**: Single source of truth for sorting — exports `sortTasks`, `SORT_ORDER_MAP`, `SORT_DIRECTIONS`, `SORT_LABELS`, `RANK_FIELD_ENUMS`, `RANK_FIELDS_COLUMNS`, `RankFieldValueMap`.
- **`client/src/lib/rank-field-styles.ts`**: Tailwind color/style mappings per rank field value — uses `RankFieldValueMap` from `sort-tasks.ts`.
- **`client/src/components/MainDropdownMenu.tsx`**: Hamburger dropdown menu extracted from Home page.
- **`client/src/components/HowToUseBanner.tsx`**: Dismissible localStorage-persisted banner for new users, shown on Home and Completed pages.
- **`client/src/components/SortInfo.tsx`**: Collapsible card showing sort order explanation, config derived from `sort-tasks.ts` constants.
- **`shared/schema/tasks.zod.ts`**: Task table, enums (Priority, Ease, Enjoyment, Time, SortOption, TaskStatus), RankField type, Zod schemas.

## External Dependencies

### Database
- **PostgreSQL**: Primary database.

### UI Libraries
- **Radix UI**: Headless components.
- **Framer Motion**: Animations.
- **Lucide React**: Icons.
- **React Day Picker**: Date selection.
- **CMDK**: Command palette.
- **Vaul**: Drawer component.

### Development Tools & Frameworks
- **Vite**: Frontend build.
- **esbuild**: Server bundling.
- **Drizzle Kit**: Database migrations.
- **TypeScript**: Language.
- **ts-rest**: Type-safe API.