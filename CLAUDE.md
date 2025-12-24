# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Guidr** (currently named "schedulr" in code) is a step-by-step guide execution app for Android and iOS. The app helps users execute multi-step processes with precise timing, such as recipes, workout routines, lab protocols, and study sessions. Built with Domain-Driven Design principles and Test-Driven Development.

**Current Status**: Early development - web components prototype being built with Lit. The frontend architecture is being established before React Native integration.

## Commands

### Build and Development
```bash
# Clean build artifacts
npm run clean

# Compile TypeScript
npm run compile

# Build bundle (Rollup)
npm run build

# Build and start dev server
npm run start

# Watch mode (build + dev server)
npm run watch
```

### Testing
```bash
# Run all tests (compiles, builds, then runs web-test-runner)
npm test

# Test in specific browsers
BROWSERS=chromium npm test
BROWSERS=chromium,firefox npm test
```

### Linting
```bash
# Run ESLint on TypeScript files
npm run lint
```

## Architecture

### Tech Stack
- **Frontend Framework**: Lit (Web Components) with TypeScript
- **Build Tool**: Rollup with SWC for bundling and minification
- **Testing**: @web/test-runner with Playwright (Chromium, Firefox, WebKit)
- **Linting**: ESLint with TypeScript support
- **Module System**: ES Modules (type: "module" in package.json)

### Code Organization

```
src/
├── main.ts                          # Entry point - exports all components
├── components/
│   ├── app.ts                       # Root <schedulr-app> component
│   ├── layout/
│   │   └── header.ts                # Header component
│   ├── schedules/
│   │   ├── schedule-list.ts         # List view for schedules
│   │   ├── task.ts                  # Individual task component
│   │   └── add-task.ts              # Task creation component
│   └── schedule.ts                  # Schedule execution view
└── common/
    ├── signal.ts                    # Reactive state management with localStorage persistence
    └── dependency-injection.ts      # DI container for testing and modularity
```

### Key Architectural Patterns

**1. Lit Web Components**
- All UI components extend `LitElement`
- Use `@customElement` decorator to register custom elements
- Use `@property` and `@state` decorators for reactive properties
- Templates use `html` tagged template literals
- Styles use `css` tagged template literals

**2. Signal-based State Management**
- Custom `Signal<T>` class in `src/common/signal.ts`
- Provides reactive state with localStorage persistence
- Supports subscribe/unsubscribe pattern
- All signals prefixed with `Schedulr_` in localStorage

**3. Dependency Injection**
- Simple DI container in `src/common/dependency-injection.ts`
- Used for swapping real/fake implementations in tests
- Pattern: `register(name, dependency)` and `resolve(name)`

**4. Domain-Driven Design**
- README mentions DDD principles but implementation is early stage
- Future architecture will include: domain entities, repositories, services, presentation layers

### Build Pipeline

1. **TypeScript Compilation**: `tsc -b` compiles TS to JS in `dist/` with source maps
2. **Rollup Bundling**: Bundles from `src/main.ts` → `dist/bundle.js`
   - Resolves node modules (@rollup/plugin-node-resolve)
   - Handles TypeScript (@rollup/plugin-typescript)
   - Minifies with SWC (@rollup/plugin-swc, target: esnext)
   - Output format: IIFE (for browser)
3. **Testing**: web-test-runner runs compiled tests (`dist/**/*.test.js`) in real browsers

### Testing Strategy

- Test files: `*.test.ts` co-located with source files
- Framework: @open-wc/testing (provides Mocha + Chai + test helpers)
- Test runner: @web/test-runner with Playwright
- Tests run in compiled form from `dist/` directory
- Test-specific ESLint rules disable `no-non-null-assertion` and `no-restricted-imports`

### TypeScript Configuration

- **Strict mode enabled**: All strict flags on
- **Target**: ESNext with DOM libs
- **Module system**: NodeNext (ES Modules)
- **Base URL**: `./src` (for absolute imports)
- **Decorators**: Experimental decorators enabled (for Lit)
- **Class fields**: `useDefineForClassFields: false` (required for Lit compatibility)
- **Output**: `dist/` with source maps and declaration files

### Code Style (ESLint)

- **Indentation**: 2 spaces
- **Quotes**: Single quotes
- **Semicolons**: Never
- **Spacing**: Object curly spacing required
- **Linebreak**: Unix (LF)
- **Special rules**:
  - No non-null assertions (`!`) except in tests
  - `@typescript-eslint/no-explicit-any` disabled
  - Space before function parens: never for named/anonymous, always for async arrows

### Running Tests

Tests must be compiled and bundled before running:
```bash
npm run pretest  # Compiles and builds
npm test         # Runs web-test-runner
```

To run a single test file, you would need to modify the `files` glob in `web-test-runner.config.js` or use file filtering options.

### Development Workflow

1. **Local development**:
   ```bash
   npm run watch  # Starts concurrent build watcher and http-server
   ```
   - Open `http://localhost:8080/index.html`
   - Edit files in `src/`
   - Rollup rebuilds on changes

2. **Testing changes**:
   ```bash
   npm test  # Runs full test suite
   ```

3. **Before committing**:
   ```bash
   npm run lint  # Check code style
   npm test      # Verify tests pass
   ```

### Important Notes

- The project is currently called "schedulr" in code but "Guidr" in documentation (README)
- Web Components are being used for the prototype; React Native integration is planned
- The app is being built for personal use on Android and iOS (no store deployment planned)
- Husky is configured for git hooks
- Semantic release is configured in `release.config.cjs`
- Uses `http-server` for local development (no complex dev server needed)

### Domain Concepts (from README)

- **Category**: Hierarchical organization unit for guides
- **Guide**: A procedure or recipe with multiple steps
- **Step**: A timed action within a guide
- **Session**: An active guide execution instance

The domain model implementation is not yet present in the codebase but will follow clean architecture principles with strict layer separation.
