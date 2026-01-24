# replit.md

## Overview

This is a task management application with hierarchical/nested task support. Users can create, edit, and organize tasks with multiple attributes (priority, ease, enjoyment, time) and nest subtasks under parent tasks. The app features a modern dark-themed UI with smooth animations and a recursive tree structure for task organization.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, React Context for UI state (task dialogs)
- **Styling**: Tailwind CSS with custom theme configuration, CSS variables for theming
- **UI Components**: shadcn/ui component library (Radix UI primitives + Tailwind)
- **Animations**: Framer Motion for list reordering and transitions
- **Build Tool**: Vite with React plugin

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ES modules)
- **API Pattern**: RESTful API with typed routes defined in `shared/routes.ts`
- **Validation**: Zod schemas for request/response validation

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema-to-validation integration
- **Schema Location**: `shared/schema.ts` - defines the tasks table with self-referential parent-child relationships
- **Migrations**: Drizzle Kit for schema migrations (`drizzle-kit push`)

### Project Structure
```
├── client/           # React frontend
│   └── src/
│       ├── components/  # UI components including shadcn/ui
│       ├── hooks/       # Custom React hooks (use-tasks, use-toast)
│       ├── pages/       # Page components (Home, not-found)
│       └── lib/         # Utilities (queryClient, utils)
├── server/           # Express backend
│   ├── index.ts      # Server entry point
│   ├── routes.ts     # API route handlers
│   ├── storage.ts    # Database access layer
│   └── db.ts         # Database connection
├── shared/           # Shared code between client/server
│   ├── schema.ts     # Drizzle schema + Zod types
│   └── routes.ts     # API route definitions with Zod validation
└── migrations/       # Database migrations
```

### API Design
Routes are defined declaratively in `shared/routes.ts` with:
- HTTP method and path
- Input validation schema (Zod)
- Response schemas for different status codes

Key endpoints:
- `GET /api/tasks` - List all tasks
- `GET /api/tasks/:id` - Get single task
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `PUT /api/tasks/:id/status` - Set task status (handles time tracking and auto-demotion)
- `DELETE /api/tasks/:id` - Delete task

### Task Data Model
Tasks have:
- `name`, `description` (text fields)
- `priority` (enum: lowest/low/medium/high/highest)
- `ease`, `enjoyment`, `time` (enums: low/medium/high or easy/medium/hard)
- `parentId` (nullable, for nested task hierarchy)
- `status` (enum: open/in_progress/pending/completed) - single status field
- `inProgressTime` (integer) - cumulative milliseconds spent in "in progress" state
- `inProgressStartedAt` (timestamp) - when the current in-progress session started
- `createdAt` (timestamp)
- `completedAt` (timestamp)

### Task Status System
- **open**: Default state for new tasks
- **in_progress**: Task being actively worked on (only ONE task can be in_progress at a time)
- **pending**: Was in_progress, now queued (multiple allowed, hoisted below in_progress)
- **completed**: Task finished

Status behaviors:
- Setting a task to in_progress auto-demotes the current in_progress task to pending
- Pending tasks are pinned at the top of the list, below the in_progress task
- Time accumulates when in in_progress status, not when pending
- Long-press (800ms) opens the Task Status dialog for status changes
- Visual indicators: blue border for in_progress, amber border for pending

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **connect-pg-simple**: Session store for PostgreSQL (available but not currently used for auth)

### UI Libraries
- **Radix UI**: Headless UI primitives (dialogs, dropdowns, forms, etc.)
- **Framer Motion**: Animation library
- **Lucide React**: Icon library
- **Embla Carousel**: Carousel component
- **React Day Picker**: Calendar/date picker
- **CMDK**: Command palette component
- **Vaul**: Drawer component

### Development Tools
- **Vite**: Frontend build tool with HMR
- **esbuild**: Server bundling for production
- **Drizzle Kit**: Database migration tool
- **TypeScript**: Type checking across the stack