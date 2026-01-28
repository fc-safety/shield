# Suggested Commands

## Development
```bash
# Start development server
npm run dev

# Start with specific environment
NODE_ENV=development npm run dev
```

## Code Quality
```bash
# Run linting
npm run lint

# Run TypeScript type checking
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

## Build & Production
```bash
# Build for production
npm run build

# Start production server
npm start
```

## Troubleshooting
```bash
# Clean install
rm -rf node_modules package-lock.json && npm install

# Clear all caches
rm -rf .cache node_modules/.cache

# Check for outdated dependencies
npm outdated
```

## Git
```bash
# Standard unix git commands work
git status
git add .
git commit -m "message"
git push
```

## System Utilities (Linux container)
```bash
ls          # List directory
cd          # Change directory
grep        # Search text
find        # Find files
cat         # View file contents
```
