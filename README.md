# TaskRankr

A multi-user task management app with priority, ease, enjoyment, and time ratings. Sort by any attribute at a glance.

## Features

- **Task Attributes**: Set priority, ease, enjoyment, and time for each task
- **Configurable Visibility**: Show/hide any attribute column; set attributes as required or optional
- **Flexible Sorting**: Sort your task list by any visible attribute
- **Hierarchical Tasks**: Create subtasks nested under parent tasks
- **Status Workflow**: Tasks flow through open, in_progress, pinned, and completed states
- **Single Focus**: Only one task can be "in progress" at a time
- **Time Tracking**: Automatically track time spent on in-progress tasks
- **Auto-Pin**: New tasks can be automatically pinned to the top
- **Multi-User**: Per-user task isolation with Replit Auth

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express, TypeScript
- **API**: ts-rest for end-to-end type safety
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Replit Auth (OpenID Connect)
- **UI Components**: shadcn/ui (Radix UI primitives)

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up your PostgreSQL database and add `DATABASE_URL` to environment
4. Push the schema: `npm run db:push`
5. Start the development server: `npm run dev`

## License

MIT
