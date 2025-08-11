# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React + TypeScript + Vite application using modern web development tooling. The project appears to be named "StandUp" and is currently a minimal starter template with some UI components.

## Development Commands

- `pnpm dev` - Start development server with hot module replacement
- `pnpm build` - Build for production (runs TypeScript compilation then Vite build)
- `pnpm lint` - Run ESLint on the codebase
- `pnpm preview` - Preview the production build locally

## Architecture & Structure

### Tech Stack
- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite with SWC for fast compilation
- **Styling**: TailwindCSS v4 with CSS variables
- **UI Components**: Radix UI primitives with custom styling
- **Component System**: shadcn/ui pattern with "new-york" style
- **Package Manager**: pnpm (lockfile present)

### Key Directories
- `src/components/ui/` - Reusable UI components built on Radix UI primitives
- `src/lib/` - Utility functions (currently just `cn` for className merging)
- `src/assets/` - Static assets like logos and images

### Import Aliases
The project uses TypeScript path mapping with `@/` pointing to `src/`:
- `@/components` - Components directory
- `@/lib` - Library/utility functions
- `@/hooks` - Custom React hooks (directory structure ready)

### Component Patterns
- UI components use `forwardRef` and accept `className` props
- Components use `class-variance-authority` for variant-based styling
- Radix UI primitives are wrapped with custom styling and data attributes
- All components include `data-slot` attributes for testing/selection

### Styling Approach
- TailwindCSS with CSS variables for theming
- Components support dark mode through CSS variables
- Uses `clsx` and `tailwind-merge` via `cn()` utility for conditional classes
- Focus states and accessibility features are built into component variants