"use client"
import React from 'react'
import { motion } from 'framer-motion'
import type { CalendarEvent, AiSuggestion } from '@/types/calendar'
import { startOfDay, addHours } from 'date-fns'
import { getEventColor, getEventsForHour } from '@/lib/utils/event-utils'

interface DayViewProps {
  currentDate: Date
  events: CalendarEvent[]
  aiSuggestions: AiSuggestion[]
  onEventClick: (event: CalendarEvent | AiSuggestion) => void
  onDragStart: (event: CalendarEvent) => void
  onDragEnd: (day: Date, hour: number) => void
}

const DayView: React.FC<DayViewProps> = ({
  currentDate,
  events,
  aiSuggestions,
  onEventClick,
  onDragStart,
  onDragEnd
}) => {
  const startOfDayDate = startOfDay(currentDate)

  const renderHours = () => {
    const hours = []
    for (let i = 0; i < 24; i++) {
      const hour = addHours(startOfDayDate, i)
      const hourEvents = getEventsForHour(events, hour)
      const hourSuggestions = aiSuggestions.filter(suggestion => 
        suggestion.suggestedStartTime.getHours() === hour.getHours() &&
        suggestion.suggestedStartTime.getDate() === hour.getDate() &&
        suggestion.suggestedStartTime.getMonth() === hour.getMonth() &&
        suggestion.suggestedStartTime.getFullYear() === hour.getFullYear()
      )

      hours.push(
        <motion.div
          key={hour.toString()}
          className="min-h-[60px] border-b p-2"
          whileHover={{ scale: 1.02 }}
          onDragOver={(e) => {
            e.preventDefault()
            e.currentTarget.classList.add('bg-indigo-200')
          }}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove('bg-indigo-200')
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.currentTarget.classList.remove('bg-indigo-200')
            onDragEnd(currentDate, i)
          }}
        >
          <span className="text-sm font-semibold">{hour.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {hourEvents.map(event => (
            <motion.div 
              key={event.id} 
              className={`text-xs ${getEventColor(event)} text-white p-1 mt-1 rounded ${event.externalCalendarId ? 'cursor-default' : 'cursor-move'}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              draggable={!event.externalCalendarId}
              onDragStart={(e) => {
                e.stopPropagation()
                if (!event.externalCalendarId) onDragStart(event)
              }}
              onClick={() => onEventClick(event)}
            >
              {event.title}
            </motion.div>
          ))}
          {hourSuggestions.map(suggestion => (
            <motion.div 
              key={suggestion.id} 
              className="text-xs bg-indigo-600 text-white p-1 mt-1 rounded cursor-pointer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => onEventClick(suggestion)}
            >
              {suggestion.title} (AI Suggestion)
            </motion.div>
          ))}
        </motion.div>
      )
    }
    return hours
  }

  return <div className="overflow-y-auto max-h-[calc(100vh-200px)]">{renderHours()}</div>
}

export default DayView