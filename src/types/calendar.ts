import type { RouterOutputs } from '@/trpc/shared'

export type CalendarEvent = RouterOutputs['calendar']['myEvents'][number]
export type AiSuggestion = RouterOutputs['aiSuggestions']['myEvents'][number]

export type ViewType = 'month' | 'week' | 'day'

export interface NewEvent extends Partial<CalendarEvent> {
  title: string
  description: string
  startTime: Date
  endTime: Date
  location: string
  isAllDay: boolean
}