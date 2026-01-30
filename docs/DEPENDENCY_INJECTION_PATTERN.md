# Dependency Injection Pattern for Component Testing

## Overview

This document describes the Dependency Injection (DI) pattern used in Guidr for component testing, specifically demonstrated in `GuideFormScreen`.

## Why Dependency Injection Over Mocking?

Traditional Jest mocking of services breaks components because:
- Jest mocks replace entire modules with undefined values
- React can't render undefined component types
- Mocks introduce coupling between tests and implementation details

The DI pattern solves this by:
- Passing services as optional props instead of mocking them
- Allowing tests to inject real service instances with mocked dependencies
- Maintaining clear separation of concerns

## Implementation Pattern

### Component Interface

Define optional service props in the component interface:

```typescript
interface GuideFormScreenProps {
  mode: 'create' | 'edit'
  onSave: (guideId: string) => void
  onCancel: () => void
  // Dependency Injection: optional for testing
  guideService?: GuideService
  categoryService?: CategoryService
}
```

### Component Function

Accept services via destructuring and mark unused ones with underscores:

```typescript
export const GuideFormScreen: React.FC<GuideFormScreenProps> = ({
  mode,
  onSave,
  onCancel,
  guideService: _guideService,  // Marked as intentionally unused
  categoryService: _categoryService,
}) => {
  // Component implementation
}
```

### Test Setup

Mock only low-level dependencies (storage, repositories), not services:

```typescript
// Mock low-level dependencies
jest.mock('@react-native-async-storage/async-storage')
jest.mock('../../infrastructure/storage/AuthStorage')
jest.mock('../../infrastructure/repositories/GuideRepository')
jest.mock('../components/SafeScreen', () => ({
  SafeScreen: ({ children, testID }: { children: React.ReactNode; testID?: string }) => (
    <View testID={testID}>{children}</View>
  ),
}))

// Do NOT mock services - inject them instead
```

### Creating Test Services

Build real service instances with mocked dependencies:

```typescript
const createTestServices = () => {
  const guideRepo = new GuideRepository('http://test-server')
  const stepRepo = new StepRepository('http://test-server')
  const categoryRepo = new CategoryRepository('http://test-server')

  return {
    guideService: new GuideService(guideRepo, stepRepo),
    categoryService: new CategoryService(categoryRepo),
  }
}
```

### Testing with Injected Services

Pass real services to the component in tests:

```typescript
it('renders form screen without errors', async () => {
  const { guideService, categoryService } = createTestServices()

  const { getByTestId } = render(
    <GuideFormScreen
      mode="create"
      onSave={mockOnSave}
      onCancel={mockOnCancel}
      guideService={guideService}
      categoryService={categoryService}
    />
  )

  await waitFor(() => {
    expect(getByTestId('guide-form-screen')).toBeTruthy()
  })
})
```

## Benefits

1. **Tests Real Service Logic**: Services are tested with real implementations, not mocks
2. **Clear Separation**: Unit tests focus on services, integration tests on components
3. **Simple Mock Setup**: Only mock external dependencies (storage, HTTP, etc)
4. **Type Safe**: Full TypeScript support without `any` types
5. **Maintainability**: Tests reflect actual usage patterns
6. **DDD Alignment**: Follows Domain-Driven Design principles

## Comparison

### ❌ Service Mocking (Old Pattern)
```typescript
jest.mock('../../domain/services/GuideService')  // ← Breaks component
jest.mock('../../domain/services/CategoryService')

// Component becomes undefined → tests fail
<GuideFormScreen ... />  // Error: undefined component
```

### ✅ Dependency Injection (New Pattern)
```typescript
// No service mocks - inject instead
const { guideService, categoryService } = createTestServices()

// Real services work properly
<GuideFormScreen
  guideService={guideService}
  categoryService={categoryService}
/>  // ✓ Works!
```

## Test Structure

```
Test Setup
├── Mock low-level dependencies (AsyncStorage, ErrorReporter)
├── Mock repositories (GuideRepository, StepRepository, etc)
├── Mock UI components (SafeScreen, CategoryPickerButton)
└── Create real services with mocked repositories

Test Execution
├── Render component with injected services
├── Verify UI renders correctly
└── Assert on user interactions
```

## Non-Test Usage

When not injected (production or non-test environments), components create services internally:

```typescript
// In production, services are created internally when needed
<GuideFormScreen
  mode="create"
  onSave={handleSave}
  onCancel={handleCancel}
  // No services passed - component creates them
/>
```

## Migration Checklist

When applying this pattern to other components:

- [ ] Add optional service props to component interface
- [ ] Mark unused injection parameters with `_` prefix
- [ ] Remove `jest.mock()` calls for services
- [ ] Create `createTestServices()` helper function
- [ ] Mock only low-level dependencies (storage, repos, HTTP)
- [ ] Mock UI components if needed
- [ ] Pass injected services to component in tests
- [ ] Verify all tests pass

## See Also

- [DDD Architecture](./adr/001-ddd-architecture.md)
- [GuideFormScreen Tests](../mobile/src/presentation/screens/GuideFormScreen.test.tsx)
- [GuideService Tests](../mobile/src/domain/services/GuideService.test.ts)
