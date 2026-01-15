# ADR 008: Strict Type Safety and Import Rules

## Status
Accepted

## Context

Guidr uses TypeScript (strict mode) and Python (with type hints) across the monorepo. Inconsistent usage of `any`/`Any` types and non-top-level imports reduce the benefits of static type checking and make the codebase harder to maintain.

**Motivations**:
1. **Type Safety**: `any` bypasses TypeScript/mypy checks, defeating the purpose of static typing
2. **Refactoring Confidence**: Strict types provide compile-time guarantees during refactoring
3. **Code Clarity**: Import statements at the top of files are easier to understand
4. **Maintainability**: Non-top-level imports (inside functions) can be surprising and harder to track
5. **Team Standards**: Consistent linting rules across platforms (Python, TypeScript, JavaScript)

## Decision

We enforce strict type safety and top-level import rules across the entire Guidr monorepo:

1. **No `any`/`Any` Types** (except legitimate exceptions):
   - TypeScript: Ban `any` type annotations and assertions via `@typescript-eslint/no-explicit-any`
   - Python: Ban `Any` in function signatures via `ruff` ANN401 rule
   - Exception: MongoDB document mappings (`dict[str, Any]`) are allowed in mappers and DTOs
   - Exception: Test files can use `any` for mocks (warning level, not error)

2. **Top-Level Imports Only**:
   - TypeScript: Enforce top-level imports via `no-restricted-syntax`
   - Python: Enforce top-level imports via `ruff` PLC0415 rule
   - No conditional imports inside functions (e.g., `import os` inside a function is prohibited)
   - Exception: None - all imports must be at module level

3. **Configuration Tools**:
   - **Python**: `ruff` (fast linter) and `mypy` (type checker)
   - **TypeScript**: ESLint with `@typescript-eslint/parser` and `eslint-plugin-typescript`

## Consequences

### Positive
- **Type Safety**: Compile-time guarantees catch refactoring errors
- **Consistency**: Same standards across Python and TypeScript
- **CI/CD Enforcement**: Violations caught before merge via linting rules
- **Future Prevention**: New code can't violate rules

### Negative
- **Migration Effort**: Required fixing 12 existing violations (3 Python, 9 TypeScript)
- **Test Mocks**: Test files still allow `any` warnings for test doubles
- **Learning Curve**: Team must understand when exceptions apply (MongoDB docs, tests)

## Implementation

### Files Modified

**Configuration**:
- `api-server/pyproject.toml`: Added PLC0415 (no non-top-level imports), ANN401 (no `Any` in signatures)
- `mobile/.eslintrc.yml`: Enabled `@typescript-eslint/no-explicit-any` (error in prod, warn in tests)
- `web-app/eslint.config.js`: Enabled `@typescript-eslint/no-explicit-any`
- `.github/workflows/ci-cd.yml`: Added web-app CI/CD jobs

**Violations Fixed**:
- **Python** (3 violations):
  - Moved `import logging` to module level in `system.py` and `app.py`
  - Moved `import uvicorn` to module level in `main.py`

- **TypeScript** (9 violations):
  - `HealthCheckService.ts`: Typed API response as `HealthCheckResponse` interface
  - `EntityCache.ts`: Changed `set()` signature to accept `T | T[]` (arrays + single items)
  - Removed `as any` from all 6 repository cache calls
  - `ApkInstaller.ts`: Added type declaration for `DownloadTask.stopDownload()`

**Test Files**: 23 existing `any` usages in tests remain as warnings (acceptable for mocks)

### Linting Rules

**Ruff (Python)**:
```toml
[tool.ruff.lint]
select = ["E", "F", "I", "N", "W", "UP", "PLC0415", "ANN401"]

[tool.ruff.lint.per-file-ignores]
"src/infrastructure/persistence/mongodb/mappers/*.py" = ["ANN401"]
"src/domain/entities/audit_log.py" = ["ANN401"]
"src/application/dtos/audit_log_dtos.py" = ["ANN401"]
```

**ESLint (TypeScript)**:
```yaml
# Production code: error
@typescript-eslint/no-explicit-any: error

# Test code: warning (allow mocks)
files: ["*.test.ts", "*.test.tsx", "*.spec.ts", "*.spec.tsx"]
@typescript-eslint/no-explicit-any: warn
```

## Verification

**Local Development**:
```bash
# Python
cd api-server && poetry run ruff check . && poetry run mypy src

# TypeScript Mobile
cd mobile && npm run lint && npm run typecheck

# TypeScript Web
cd web-app && npm run lint && npm run typecheck
```

**CI/CD**: GitHub Actions enforces all rules on PRs:
- `api-server-lint`: ruff + mypy
- `mobile-lint` / `mobile-typecheck`: ESLint + TypeScript
- `web-app-lint` / `web-app-typecheck`: ESLint + TypeScript

## Exceptions and Clarifications

1. **MongoDB Documents**: Using `dict[str, Any]` in repository mappers is intentional and allowed (documents are schemaless)
2. **Test Mocks**: Test files warn (not error) to allow flexible mocking patterns
3. **Legitimate APIs**: When third-party libraries have missing types, create `.d.ts` declarations instead of `as any`

## Related ADRs

- [ADR-006](./006-admin-user-authorization.md): Admin user authorization
- [ADR-007](./007-user-based-admin-mode-mobile.md): User-based admin mode

## References

- [TypeScript Handbook: Any](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html#type-guards-and-type-predicates)
- [Ruff Rules: PLC0415 (import-outside-toplevel)](https://docs.astral.sh/ruff/rules/#pylint)
- [ESLint Rule: @typescript-eslint/no-explicit-any](https://typescript-eslint.io/rules/no-explicit-any/)
