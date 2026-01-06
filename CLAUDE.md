# Shield Development Guide

## Quick Start Commands

### Development

```bash
# Start development server
npm run dev

# Run in a specific environment
NODE_ENV=development npm run dev
```

### Code Quality

```bash
# Run linting
npm run lint

# Run type checking
npm run typecheck

# Run both lint and typecheck
npm run lint && npm run typecheck

# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Build & Production

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
shield/
├── app/              # Main application code
│   ├── components/   # React components
│   ├── routes/       # React Router route modules
│   ├── lib/          # Utilities and helpers
│   ├── styles/       # Global styles
│   └── types/        # TypeScript type definitions
├── public/           # Static assets
└── tests/           # Test files
```

## Common Development Tasks

### Creating a New Component

1. Create component file in `app/components/` with proper naming (e.g., `user-profile-card.tsx`)
2. Follow existing component patterns using Radix UI primitives
3. Use TypeScript interfaces for props
4. Style with Tailwind CSS v4

### Adding a New Route

1. Routes are added to `app/routes/` directory and configured in `app/routes.ts`
2. Export default component for the route
3. Add loader/action functions as needed for data fetching
4. Use proper error boundaries

### Working with Forms

- Use React Router's Form component for server-side form handling
- Implement proper validation using zod schemas
- Follow existing patterns in components like `update-user-role-form.tsx`

### API Integration

- API routes are defined in `app/lib/shield-api.ts`
- Use React Query hooks for data fetching (see `app/lib/api-hooks.ts`)
- Follow existing patterns for error handling and loading states

## Key Libraries & Patterns

### UI Components

- **Radix UI**: For accessible, unstyled components
- **Tailwind CSS v4**: For styling
- **lucide-react**: For icons
- **cn()**: Utility for conditional classes from `app/lib/utils.ts`

### State Management

- **Zustand**: For client-side state (see `app/lib/stores/`)
- **React Query**: For server state and caching
- **React Router**: For route-based state via loaders/actions

### Form Handling

- **React Hook Form**: For complex forms
- **Zod**: For schema validation
- **Server Actions**: Via React Router actions

### Authentication

- Keycloak SSO integration
- Role-based access control (RBAC)
- Protected routes with proper redirects

## React Router 7 Architecture

This project uses React Router 7, which has a different architecture than Next.js.

### No "use client" or "use server" Directives

React Router 7 does **NOT** use the `"use client"` or `"use server"` directives found in Next.js. Instead, React Router uses a different model for separating server and client code:

- **Loaders**: Run on the server to fetch data before rendering. Export a `loader` function from route modules.
- **Actions**: Run on the server to handle form submissions and mutations. Export an `action` function from route modules.
- **Components**: The default export runs on both server (SSR) and client (hydration).

```tsx
// Example route module (app/routes/users.tsx)
import type { Route } from "./+types/users";

// Runs on the server - fetches data
export async function loader({ request }: Route.LoaderArgs) {
  const users = await db.users.findMany();
  return { users };
}

// Runs on the server - handles form submissions
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  await db.users.create({ name: formData.get("name") });
  return { success: true };
}

// Renders on server and client
export default function Users({ loaderData }: Route.ComponentProps) {
  return <div>{loaderData.users.map(u => <p key={u.id}>{u.name}</p>)}</div>;
}
```

### Key Differences from Next.js

| Feature | Next.js | React Router 7 |
|---------|---------|----------------|
| Server code | `"use server"` directive | `loader`/`action` exports |
| Client code | `"use client"` directive | All components hydrate by default |
| Data fetching | Server Components or API routes | Loaders |
| Mutations | Server Actions | Actions via `<Form>` |

### Client-Only Code

For code that should only run on the client (e.g., browser APIs), use standard React patterns:

```tsx
import { useEffect, useState } from "react";

function ClientOnlyFeature() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <div>Client-only content using {window.localStorage.getItem("key")}</div>;
}
```

## Development Tips

1. **Type Safety**: Always define TypeScript types for props, API responses, and form data
2. **Component Patterns**: Follow existing patterns in `app/components/` for consistency
3. **Error Handling**: Use error boundaries and proper error states in components
4. **Accessibility**: Use semantic HTML and Radix UI for accessible components
5. **Performance**: Use React Router's deferred data loading for non-critical data

## Testing Guidelines

1. Write tests for critical business logic
2. Use React Testing Library for component tests
3. Mock API calls using MSW or jest mocks
4. Test both happy paths and error states

## Environment Variables

Key environment variables used in the project:

- `NODE_ENV`: Development/production mode
- `VITE_*`: Client-side environment variables (see Vite docs)
- Server-side variables are loaded via React Router's server build

## Troubleshooting

### Common Issues

1. **Type Errors**: Run `npm run typecheck` to generate React Router types
2. **Build Failures**: Clear `.cache` and `node_modules/.cache` directories
3. **Hot Reload Issues**: Restart dev server if HMR stops working
4. **Test Failures**: Ensure you're mocking external dependencies properly

### Useful Debug Commands

```bash
# Clean install
rm -rf node_modules package-lock.json && npm install

# Clear all caches
rm -rf .cache node_modules/.cache

# Check for outdated dependencies
npm outdated

# Analyze bundle size
npm run build -- --analyze
```

## Code Style Conventions

1. **File Naming**: Use kebab-case for files (e.g., `user-profile.tsx`)
2. **Component Naming**: Use PascalCase for components
3. **Imports**: Group imports by type (React, libraries, local)
4. **Props**: Define interfaces with descriptive names
5. **Hooks**: Custom hooks start with `use` prefix
6. **Constants**: Use UPPER_SNAKE_CASE for true constants

## Git Workflow

1. Create feature branches from `main`
2. Use conventional commits (feat:, fix:, chore:, etc.)
3. Run lint and tests before committing
4. Keep commits focused and atomic
5. Write descriptive commit messages

## Performance Optimization

1. Use React Router's deferred loading for non-critical data
2. Implement proper loading states
3. Use React.memo for expensive components
4. Optimize images with proper formats and sizes
5. Lazy load routes and components where appropriate
