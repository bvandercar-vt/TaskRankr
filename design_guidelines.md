# Design Guidelines: Modern Task Management App

## Design Approach
**Reference-Based**: Drawing from Linear, Todoist, and Things 3 - modern productivity tools that balance minimalism with rich functionality. Emphasis on information hierarchy, gesture-based interactions, and calm visual design.

## Typography System
- **Primary Font**: Inter (Google Fonts) - clean, readable at all sizes
- **Hierarchy**:
  - Hero/Display: 3xl to 5xl, font-semibold
  - Page Titles: 2xl, font-semibold
  - Section Headers: lg, font-medium
  - Task Titles: base, font-medium
  - Body/Descriptions: sm, font-normal
  - Metadata/Labels: xs, font-normal, uppercase tracking-wide

## Layout & Spacing System
**Spacing Units**: Tailwind 2, 3, 4, 6, 8, 12, 16 units
- Component padding: p-4 (mobile), p-6 (desktop)
- Section spacing: space-y-6 (mobile), space-y-8 (desktop)
- Card gaps: gap-3 (mobile), gap-4 (desktop)
- Page margins: px-4 (mobile), px-8 (desktop)

## Core Layout Structure

### Desktop (lg+)
Three-column layout:
- **Sidebar** (64 width): Project navigation, filters, tags
- **Task List** (96 width): Main content area, scrollable task groups
- **Detail Panel** (80 width, collapsible): Selected task details, subtasks, comments

### Mobile (base to md)
Single-column stack with bottom navigation:
- Full-width task list as primary view
- Slide-up drawer for task details
- Fixed bottom nav (5 icons): Today, Projects, Search, Add, Profile

## Component Library

### Navigation
**Desktop Sidebar**:
- Logo/brand at top (h-16)
- Quick filters section (Today, Upcoming, Completed)
- Projects list with expand/collapse
- Tags/labels section
- Settings at bottom

**Mobile Bottom Nav**:
- 5 equally spaced icons with labels
- Active state indicator (subtle underline)
- Floating action button (FAB) for quick add, positioned above nav

### Task Components
**Task Card** (repeating unit):
- Checkbox (leading, size-5, rounded)
- Task title (truncate with hover expand)
- Priority indicator (vertical bar, h-full w-1, left edge)
- Due date badge (trailing, text-xs)
- Project tag (small pill, if assigned)
- Subtask counter (if applicable)
- Hover: Reveal quick actions (edit, delete, move)

**Task Group Header**:
- Date or project name (text-sm, uppercase, tracking-wide)
- Task count
- Collapse/expand toggle
- Bottom border separator

### Detail Panel
**Task Detail View**:
- Large task title (editable inline)
- Description editor (markdown support)
- Metadata grid: Due date, Priority, Project, Assignee
- Subtasks list (nested checkboxes)
- Attachments section (file upload area)
- Comments/Activity feed
- Action buttons at bottom (Delete, Archive)

### Forms & Inputs
**Quick Add Modal**:
- Centered overlay (max-w-2xl)
- Large text input for task name
- Expandable fields: description, due date, project, priority
- Smart parsing (e.g., "tomorrow" sets due date)
- Keyboard shortcuts displayed subtly

**Input Fields**:
- Minimal borders (bottom border only in dark mode)
- Focus state: subtle glow/underline
- Icons inside inputs (calendar for dates, tag for projects)

### Data Visualization
**Progress Indicators**:
- Daily progress ring (circular, showing completed/total)
- Weekly heatmap (7-day grid, activity intensity)
- Project progress bars (horizontal, within project cards)

**Empty States**:
- Centered illustration placeholder
- Encouraging message
- Primary action button
- Tips for getting started

### Overlays & Modals
**Task Creation/Edit**:
- Slide-up drawer (mobile)
- Centered modal (desktop, max-w-3xl)
- Backdrop blur effect

**Contextual Menus**:
- Right-click menus (desktop)
- Long-press menus (mobile)
- Options: Edit, Duplicate, Move, Delete, Share

## Images

### Hero Section (Marketing/Landing)
**Full-width hero image** (h-screen on desktop, h-96 on mobile):
- **Image Description**: Clean desk setup with laptop showing the app interface, soft natural lighting, minimalist workspace aesthetic, shallow depth of field. Alternatively: Abstract 3D rendered composition of floating task cards and checkboxes in a organized constellation.
- **Placement**: Top of landing page, full viewport width
- **Overlay Elements**: 
  - Hero headline (text-4xl to text-6xl, centered, z-10)
  - Subheading (text-lg, max-w-2xl, centered)
  - CTA buttons with backdrop-blur-md backgrounds (px-8 py-4, rounded-full)
  - Optional: Animated scroll indicator at bottom

### App Interface
No decorative images within the app itself - maintain focus on content and tasks. Icons only from Heroicons (outline style for inactive, solid for active states).

## Animations
- **Micro-interactions only**:
  - Checkbox check animation (scale + checkmark draw)
  - Task completion (strike-through + fade)
  - Smooth height transitions for expand/collapse (duration-200)
  - Page transitions (slide + fade, duration-300)
- **No** parallax, scroll-triggered, or decorative animations

## Accessibility
- All interactive elements minimum 44px touch target
- Keyboard navigation throughout (tab order, shortcuts)
- ARIA labels on icon buttons
- Focus indicators clearly visible
- Skip navigation links