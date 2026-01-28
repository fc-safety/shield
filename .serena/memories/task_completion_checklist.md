# Task Completion Checklist

When completing a coding task, always run through these steps:

## 1. Type Checking
```bash
npm run typecheck
```
- Generates React Router types first
- Runs TypeScript compiler in strict mode
- Fix all type errors before proceeding

## 2. Linting
```bash
npm run lint
```
- ESLint with TypeScript, React, and accessibility rules
- Fix all linting errors
- Follow existing code patterns

## 3. Testing (if applicable)
```bash
npm test
```
- Run tests for affected code
- Add tests for new functionality
- Ensure all tests pass

## 4. Manual Verification
- Start dev server: `npm run dev`
- Verify the feature works as expected
- Check for console errors

## 5. Git Commit Guidelines
- Create feature branches from `main`
- Use conventional commits: `feat:`, `fix:`, `chore:`, etc.
- Keep commits focused and atomic
- Write descriptive commit messages

## Quick Combined Check
```bash
npm run lint && npm run typecheck && npm test
```
