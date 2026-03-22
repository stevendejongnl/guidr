export interface AuditLog {
  id: string
  eventType: string
  occurredAt: string
  userId: string | null
  resourceType: string | null
  resourceId: string | null
  action: string
  details: Record<string, unknown>
  ipAddress: string | null
  userAgent: string | null
}

export interface AuditLogFilters {
  userId?: string
  resourceType?: string
  resourceId?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}
