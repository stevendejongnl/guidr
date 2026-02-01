// Mock validators that simply pass through values during tests
const createMockValidator = <T,>() => {
  return (value: T): T => value;
};

export const validateCategoryDto = createMockValidator<any>();
export const validateCategoryList = createMockValidator<any>();
export const validateCategoryCreateRequest = createMockValidator<any>();
export const validateCategoryUpdateRequest = createMockValidator<any>();
export const validateGuideDto = createMockValidator<any>();
export const validateGuideList = createMockValidator<any>();
export const validateGuideCreateRequest = createMockValidator<any>();
export const validateGuideUpdateRequest = createMockValidator<any>();
export const validateStepDto = createMockValidator<any>();
export const validateStepList = createMockValidator<any>();
export const validateStepCreateRequest = createMockValidator<any>();
export const validateStepUpdateRequest = createMockValidator<any>();
export const validateSessionDto = createMockValidator<any>();
export const validateSessionList = createMockValidator<any>();
export const validateSessionCreateRequest = createMockValidator<any>();
export const validateSessionUpdateRequest = createMockValidator<any>();
export const validateUserDto = createMockValidator<any>();
export const validateUserList = createMockValidator<any>();
export const validateUserCreateRequest = createMockValidator<any>();
export const validateUserUpdateRequest = createMockValidator<any>();
