import type { CalendarEvent } from '@/types/calendar'
import { addHours, isSameDay, isWithinInterval } from 'date-fns'

export const getEventColor = (event: CalendarEvent) => {
  return event.externalCalendarId ? 'bg-indigo-500' : 'bg-emerald-500'
}

export const getEventsForDay = (events: CalendarEvent[], day: Date) => {
  return events.filter(event => isSameDay(event.startTime, day))
}

export const getEventsForHour = (events: CalendarEvent[], hour: Date) => {
  return events.filter(event => 
    isWithinInterval(event.startTime, { start: hour, end: addHours(hour, 1) })
  )
}