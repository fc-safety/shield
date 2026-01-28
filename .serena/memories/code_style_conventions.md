# Code Style and Conventions

## React Router 7 Architecture
This project uses React Router 7, NOT Next.js. Key differences:
- **NO** `"use client"` or `"use server"` directives
- Use `loader` functions for server-side data fetching
- Use `action` functions for form handling/mutations
- Components render on both server (SSR) and client (hydration)

## File Naming
- **Files**: kebab-case (e.g., `user-profile-card.tsx`)
- **Components**: PascalCase (e.g., `UserProfileCard`)
- **Hooks**: camelCase with `use` prefix (e.g., `useUserData`)
- **Constants**: UPPER_SNAKE_CASE

## TypeScript
- Strict mode enabled
- Always define interfaces for props
- Use type imports: `import type { ... }`
- Path aliases: `~/` or `@/` for app imports

## Prettier Configuration
- Semicolons: yes
- Single quotes: no (double quotes)
- Trailing commas: es5
- Tab width: 2 spaces
- Print width: 100 characters
- Arrow parens: always

## Component Patterns
- Use Radix UI primitives for accessible components
- Style with Tailwind CSS v4
- Use `cn()` utility from `~/lib/utils` for conditional classes
- Icons from `lucide-react`

## State Management
- **Zustand**: Client-side state (stores in `app/lib/stores/`)
- **React Query**: Server state and caching (`app/lib/api-hooks.ts`)
- **React Router**: Route-based state via loaders/actions

## Form Handling
- Use React Hook Form for complex forms
- Validate with Zod schemas
- Use React Router's `<Form>` component for server actions

## Route Module Pattern
```tsx
import type { Route } from "./+types/route-name";

export async function loader({ request }: Route.LoaderArgs) {
  // Server-side data fetching
  return { data };
}

export async function action({ request }: Route.ActionArgs) {
  // Handle form submissions
  return { success: true };
}

export default function RouteName({ loaderData }: Route.ComponentProps) {
  return <div>{/* Component JSX */}</div>;
}
```

## Import Order
1. React imports
2. Third-party library imports
3. Local imports (using `~/` alias)
