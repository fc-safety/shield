# Shield Project Overview

## Purpose
Shield is a web application for safety management and operations. It provides features for user management, role-based access control, and data visualization.

## Tech Stack
- **Framework**: React Router 7 (formerly Remix)
- **Language**: TypeScript (strict mode)
- **Runtime**: Node.js >= 20.0.0
- **Build Tool**: Vite 7
- **UI**: React 19, Radix UI primitives, Tailwind CSS v4
- **State Management**: Zustand (client state), TanStack React Query (server state)
- **Forms**: React Hook Form + Zod validation
- **Testing**: Jest + React Testing Library
- **Error Tracking**: Sentry
- **Authentication**: Keycloak SSO (via remix-auth-oauth2)

## Project Structure
```
shield/
├── app/                    # Main application code
│   ├── .client/           # Client-only code
│   ├── .server/           # Server-only code
│   ├── components/        # React components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities, API, stores
│   ├── routes/            # React Router route modules
│   ├── root.tsx           # Root layout
│   ├── routes.ts          # Route configuration
│   ├── entry.client.tsx   # Client entry point
│   └── entry.server.tsx   # Server entry point
├── public/                # Static assets
├── build/                 # Production build output
└── tests/                 # Test files
```

## Key Dependencies
- **@tanstack/react-query**: Server state and caching
- **@tanstack/react-table**: Data tables
- **date-fns**: Date utilities
- **echarts**: Charts and visualizations
- **lucide-react**: Icons
- **zod**: Schema validation
- **zustand**: Client-side state

## Path Aliases
- `~/` → `./app/`
- `@/` → `./app/`
