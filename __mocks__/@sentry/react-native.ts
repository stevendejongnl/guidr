export const captureException = jest.fn()
export const captureMessage = jest.fn()
export const withScope = jest.fn((callback) => {
  const scope = {
    setTag: jest.fn(),
    setExtra: jest.fn(),
    setContext: jest.fn(),
  }
  callback(scope)
})
export const init = jest.fn()
export const wrap = jest.fn((component) => component)
export const mobileReplayIntegration = jest.fn()
export const feedbackIntegration = jest.fn()
