# Agent Instructions for Legal RAG Playground (fork of RAG-Play)

## Build Commands

```bash
# Install dependencies
pnpm install

# Development server
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start
```

## Lint Commands

```bash
# Run ESLint (runs automatically on pre-commit via husky)
pnpm lint

# Lint specific file
npx next lint --file src/app/page.tsx
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── components/        # Shared app components
│   ├── experiment/        # RAG experiment pages
│   │   ├── components/    # Experiment-specific components
│   │   ├── types/         # TypeScript types
│   │   └── workers/       # Web Workers
│   ├── stores/            # Zustand stores (experiment/)
│   └── globals.css        # Tailwind + theme CSS
├── components/            # shadcn/ui components
│   └── ui/               # Base UI components
└── lib/                  # Utility functions
```

## Code Style Guidelines

### TypeScript
- Use strict mode enabled
- Prefer `interface` over `type` for object definitions
- Use explicit return types for exported functions
- Use `const` for immutable values, `let` only when necessary
- Avoid `any` - use `unknown` with type guards when needed

### Naming Conventions
- Components: PascalCase (e.g., `TextSplittingTab`)
- Functions/variables: camelCase (e.g., `handleClick`, `chunkSize`)
- Event handlers: prefix with `handle` (e.g., `handleSubmit`)
- Constants: UPPER_SNAKE_CASE for true constants
- Types/Interfaces: PascalCase (e.g., `ButtonProps`)

### React Components
- Use functional components with arrow functions
- Use early returns for conditional rendering
- Prefer composition over inheritance
- Keep components focused and single-responsibility
- Use `React.forwardRef` when ref forwarding needed

### Styling (TailwindCSS)
- Always use Tailwind classes; avoid inline styles
- Use `cn()` utility from `@/lib/utils` for conditional classes
- Use `class:` instead of ternary operators when possible
- Follow mobile-first responsive design
- Use theme variables (e.g., `bg-primary`, `text-foreground`)

### Imports
```typescript
// 1. External libraries (React, Next.js)
import * as React from "react"
import { NextRequest, NextResponse } from 'next/server'

// 2. UI components (shadcn)
import { Button } from "@/components/ui/button"

// 3. Local components
import { Header } from "@/app/components/header"

// 4. Utilities/types
import { cn } from "@/lib/utils"
```

### Error Handling
- Use explicit error types with descriptive messages
- Validate inputs at function boundaries
- Throw errors for unrecoverable states with context
- Use early returns to avoid nested conditionals

### Accessibility
- Include `aria-label` on interactive elements
- Add `tabIndex={0}` for keyboard navigation
- Support keyboard events (`onKeyDown`) alongside clicks
- Use semantic HTML elements

### State Management
- Use Zustand for global state (stores in `src/app/stores/`)
- Prefer local state when possible (useState, useReducer)
- Keep state close to where it's used

## Cursor Rules (.cursorrules)

From the project's Cursor configuration:

- Follow user's requirements carefully & to the letter
- First think step-by-step, describe plan in pseudocode
- Confirm, then write code!
- Write correct, best practice, DRY principle code
- Focus on easy readability over performance
- Fully implement all requested functionality
- Leave NO todos, placeholders, or missing pieces
- Include all required imports
- Properly name key components
- Be concise, minimize other prose
- If unsure, say so instead of guessing
- Use early returns whenever possible
- Always use Tailwind classes for styling (avoid CSS/tags)
- Use descriptive variable/function names
- Event functions named with "handle" prefix
- Implement accessibility features (tabindex, aria-label, onClick, onKeyDown)
- Use consts instead of functions (e.g., `const toggle = () =>`)

## Pre-commit Hooks

Husky runs `npm run lint` automatically before each commit.

## Environment Variables

Required:
- `ANTHROPIC_API_KEY` - read by the Anthropic SDK in `src/app/api/generate/route.ts`

Optional:
- `ANTHROPIC_MODEL` - Claude model id (default `claude-opus-5`); must support adaptive thinking and `output_config.effort`
- `ACCESS_CODE` - class code the browser must send (header `x-access-code`) before the server calls the model
- `GOOGLE_SITE_VERIFICATION_ID` - For SEO verification

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript 5+
- **Styling**: TailwindCSS 3.4+
- **UI Components**: shadcn/ui (New York style)
- **State**: Zustand
- **Icons**: Lucide React
- **Package Manager**: pnpm
- **Linting**: ESLint (Next.js config)

## Key Dependencies

- `@huggingface/transformers` - ML embeddings
- `langchain` - Text processing
- `umap-js` - Dimensionality reduction
- `@anthropic-ai/sdk` - Claude API (streaming, adaptive thinking, effort)
- `zustand` - State management
- `tailwindcss-animate` - Animations
- `sonner` - Toast notifications

## Notes for Agents

- This is a RAG (Retrieval-Augmented Generation) teaching tool for law students; copy must stay plain (no practice jargon)
- The corpus lives in `src/app/experiment/constants/legal-corpus.ts`; chunks are traced to documents by the `=== SOURCE n: title ===` header lines
- Scenarios (class presets) live in `src/app/experiment/constants/scenarios.ts`
- Generation streams newline-delimited JSON events (`thinking`, `text`, `done`, `error`) from `/api/generate`; the client hook is `src/app/hooks/useGeneration.ts`
- Do not call Claude through any provider shim; use `@anthropic-ai/sdk` directly
- Uses Web Workers for heavy computation (embedding generation)
- Mobile devices are redirected from `/experiment` routes via middleware
- No test framework currently configured
- Prefers functional programming patterns
- Uses CSS variables for theming (light/dark mode)
