# Shield - FC Safety Asset Management System

Shield is an enterprise asset management and safety compliance platform built with React Router v7 (formerly Remix). It provides comprehensive tracking of physical assets, inspection management, and safety compliance monitoring across multiple client organizations.

## 🚀 Quick Start

### Prerequisites

- Node.js 20 or higher
- npm or yarn
- Environment variables configured (see Configuration section)

### Development Setup

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Run in a separate terminal for type checking
npm run typecheck -- --watch
```

The application will be available at http://localhost:5173 by default.

## 🏗️ Project Structure

```
app/
├── components/          # React components organized by feature
│   ├── ui/             # Base UI components (buttons, forms, modals)
│   ├── admin/          # Admin panel components
│   ├── assets/         # Asset management components
│   ├── clients/        # Client and site management
│   ├── dashboard/      # Dashboard charts and widgets
│   ├── inspections/    # Inspection tracking components
│   └── products/       # Product catalog components
├── contexts/           # React contexts for global state
├── hooks/              # Custom React hooks
├── lib/                # Core utilities
│   ├── models/         # TypeScript type definitions
│   ├── schemas/        # Zod validation schemas
│   ├── utils/          # Helper functions
│   └── constants/      # Application constants
├── routes/             # File-based routing
│   ├── admin/          # Admin panel routes
│   ├── api/            # API proxy routes
│   ├── assets/         # Asset management pages
│   ├── auth/           # Authentication routes
│   ├── inspect/        # Inspection workflow
│   └── products/       # Product management
└── .server/            # Server-side code
    ├── auth/           # Authentication logic
    ├── config.ts       # Environment configuration
    └── api-client.ts   # API client setup
```

## 🛠️ Development Guidelines

### Code Quality

```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint -- --fix

# Type checking
npm run typecheck

# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch
```

### Component Development

Components follow a consistent pattern:

```tsx
// Example component structure
// app/components/feature/my-component.tsx
import { cn } from "~/lib/utils";

interface MyComponentProps {
  className?: string;
  // ... other props
}

export function MyComponent({ className, ...props }: MyComponentProps) {
  return (
    <div className={cn("base-styles", className)} {...props}>
      {/* Component content */}
    </div>
  );
}
```

### State Management

- **Global State**: Zustand stores in `app/contexts/`
- **Server State**: React Query for API data fetching
- **Form State**: React Hook Form with Zod validation
- **UI State**: Local component state with useState

### API Integration

All API calls go through the centralized client:

```tsx
// Example API usage
import { apiClient } from "~/.server/api-client";

// In a loader
export async function loader({ request }: LoaderFunctionArgs) {
  const session = await authenticator.isAuthenticated(request);
  const data = await apiClient.assets.list(session?.accessToken);
  return json(data);
}
```

### Routing

Routes follow React Router v7 conventions:

- `routes/_index.tsx` - Home page
- `routes/assets._index.tsx` - Asset listing
- `routes/assets.$id.tsx` - Asset detail page
- `routes/api.$.ts` - API proxy routes

### UI Components

The project uses a custom component library built on Radix UI:

- Import from `~/components/ui/*`
- Components use Tailwind CSS for styling
- Variants handled by class-variance-authority (CVA)
- See component examples in Storybook (if available)

## 🔐 Authentication

Shield uses Keycloak for enterprise SSO:

- OAuth2/OIDC flow handled by remix-auth-oauth2
- Session management in `app/.server/auth/`
- Protected routes use `authenticator.isAuthenticated()`
- Permissions checked via `hasPermission()` utility

## 🎨 Styling

- **Framework**: Tailwind CSS v4
- **Approach**: Utility-first with component classes
- **Animations**: Custom animations in `tailwind.config.js`
- **Theme**: Customizable via CSS variables
- **Icons**: Lucide React icons

## 📦 Key Dependencies

- **React Router v7**: Full-stack React framework
- **React 19**: Latest React with improved performance
- **TypeScript**: Type safety throughout
- **Tailwind CSS v4**: Utility-first styling
- **Radix UI**: Accessible component primitives
- **Zustand**: Lightweight state management
- **React Query**: Server state management
- **React Hook Form**: Form handling
- **Zod**: Schema validation
- **ECharts/Recharts**: Data visualization

## 🚀 Deployment

### Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Environment Variables

Required environment variables:

```env
# Authentication
KEYCLOAK_DOMAIN=your-keycloak-domain.com
KEYCLOAK_REALM=your-realm
KEYCLOAK_CLIENT_ID=your-client-id
KEYCLOAK_CLIENT_SECRET=your-client-secret

# API Configuration
API_URL=https://api.your-domain.com
API_ANON_KEY=your-anonymous-key

# AWS Services
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Application
SESSION_SECRET=your-session-secret
APP_URL=https://your-app-domain.com
```

### Docker Deployment

```dockerfile
# Example Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- path/to/test.spec.ts
```

Test files should be colocated with components:
- `my-component.tsx`
- `my-component.test.tsx`

## 📚 Additional Resources

- [React Router v7 Documentation](https://reactrouter.com/v7/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

## 🤝 Contributing

1. Create a feature branch from `main`
2. Make your changes following the code style
3. Add tests for new functionality
4. Ensure all tests pass and linting is clean
5. Submit a pull request with a clear description

## 📄 License

[Your License Here]
