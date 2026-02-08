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