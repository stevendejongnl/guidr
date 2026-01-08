import * as Sentry from '@sentry/react-native'

export interface ErrorContext {
  component?: string
  action?: string
  userId?: string
  [key: string]: string | number | boolean | undefined
}

export class ErrorReporter {
  static capture(error: Error | unknown, context?: ErrorContext): void {
    // Log to console for development
    console.error('[ErrorReporter]', context?.action || 'Error occurred:', error)

    // Convert unknown errors to Error objects
    const errorToReport = error instanceof Error ? error : new Error(String(error))

    // Add context tags for better filtering in Sentry
    if (context) {
      Sentry.withScope((scope) => {
        Object.entries(context).forEach(([key, value]) => {
          if (value !== undefined) {
            scope.setTag(key, String(value))
          }
        })
        Sentry.captureException(errorToReport)
      })
    } else {
      Sentry.captureException(errorToReport)
    }
  }

  static captureMessage(
    message: string,
    level: 'info' | 'warning' | 'error' = 'info',
    context?: ErrorContext
  ): void {
    console.log('[ErrorReporter]', message, context)

    if (context) {
      Sentry.withScope((scope) => {
        Object.entries(context).forEach(([key, value]) => {
          if (value !== undefined) {
            scope.setTag(key, String(value))
          }
        })
        Sentry.captureMessage(message, level)
      })
    } else {
      Sentry.captureMessage(message, level)
    }
  }
}
