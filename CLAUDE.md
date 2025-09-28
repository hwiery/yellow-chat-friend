# Claude Code Configuration

## Project Overview
This is a React + TypeScript + Vite project using ShadCN UI components and Tailwind CSS for styling.

## Tech Stack
- **Framework**: React 18.3.1
- **Build Tool**: Vite 5.4.19
- **Language**: TypeScript 5.8.3
- **Styling**: Tailwind CSS 3.4.17
- **UI Components**: ShadCN UI (Radix UI primitives)
- **Routing**: React Router DOM 6.30.1
- **State Management**: TanStack Query 5.83.0
- **Forms**: React Hook Form 7.61.1 with Zod validation

## Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Code Quality
- **Linting**: ESLint with TypeScript and React plugins
- **Type Checking**: TypeScript strict mode enabled
- **Formatting**: Run `npm run lint` before commits

## Project Structure
- `/src` - Source code
- `/public` - Static assets
- `/src/components` - Reusable UI components (ShadCN)
- Component naming follows kebab-case for files, PascalCase for exports

## Notes
- Uses bun.lockb (Bun package manager)
- Configured with Lovable tagger for development
- Next.js themes support for dark/light mode