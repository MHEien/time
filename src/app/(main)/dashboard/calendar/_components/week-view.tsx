"use client"
import React from 'react'
import { motion } from 'framer-motion'
import type { CalendarEvent, AiSuggestion } from '@/types/calendar'
import { startOfWeek, endOfWeek, addDays, isSameDay } from 'date-fns'
import { getEventColor, getEventsForDay } from '@/lib/utils/event-utils'

interface WeekViewProps {
  currentDate: Date
  selectedDate: Date
  events: CalendarEvent[]
  aiSuggestions: AiSuggestion[]
  onDateClick: (day: Date) => void
  onEventClick: (event: CalendarEvent | AiSuggestion) => void
  onDragStart: (event: CalendarEvent) => void
  onDragEnd: (day: Date) => void
}

const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  selectedDate,
  events,
  aiSuggestions,
  onDateClick,
  onEventClick,
  onDragStart,
  onDragEnd
}) => {
  const startDate = startOfWeek(currentDate)
  const endDate = endOfWeek(currentDate)

  const sortEvents = (events: (CalendarEvent | AiSuggestion)[]): (CalendarEvent | AiSuggestion)[] => {
    return events.sort((a, b) => {
      const aStartTime = 'startTime' in a ? a.startTime : a.suggestedStartTime
      const bStartTime = 'startTime' in b ? b.startTime : b.suggestedStartTime
      const aEndTime = 'endTime' in a ? a.endTime : a.suggestedEndTime
      const bEndTime = 'endTime' in b ? b.endTime : b.suggestedEndTime

      // First, sort by start time (ascending)
      if (aStartTime.getTime() !== bStartTime.getTime()) {
        return aStartTime.getTime() - bStartTime.getTime()
      }
      // If start times are the same, sort by duration (shortest first)
      const aDuration = aEndTime.getTime() - aStartTime.getTime()
      const bDuration = bEndTime.getTime() - bStartTime.getTime()
      return aDuration - bDuration
    })
  }

  const renderWeek = () => {
    const days = []
    let day = startDate
    while (day <= endDate) {
      const dayEvents = getEventsForDay(events, day)
      const daySuggestions = aiSuggestions.filter(suggestion => 
        isSameDay(suggestion.suggestedStartTime, day)
      )
      const sortedItems = sortEvents([...dayEvents, ...daySuggestions])

      days.push(
        <motion.div
          key={day.toString()}
          className={`min-h-[100px] border rounded-lg p-2 ${
            isSameDay(day, selectedDate) ? "bg-indigo-100" : "bg-white"
          } hover:shadow-lg transition-all duration-300`}
          onClick={() => onDateClick(day)}
          whileHover={{ scale: 1.05 }}
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
            onDragEnd(day)
          }}
        >
          <span className="text-sm font-semibold">{day.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}</span>
          {sortedItems.map(item => {
            const isAiSuggestion = 'suggestedStartTime' in item
            return (
              <motion.div 
                key={item.id} 
                className={`text-xs ${isAiSuggestion ? 'bg-indigo-600' : getEventColor(item)} text-white p-1 mt-1 rounded ${isAiSuggestion || (item).externalCalendarId ? 'cursor-pointer' : 'cursor-move'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                draggable={!isAiSuggestion && !(item).externalCalendarId}
                onDragStart={(e) => {
                  e.stopPropagation()
                  if (!isAiSuggestion && !(item).externalCalendarId) onDragStart(item)
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  onEventClick(item)
                }}
              >
                {item.title} {isAiSuggestion && '(AI Suggestion)'}
              </motion.div>
            )
          })}
        </motion.div>
      )
      day = addDays(day, 1)
    }
    return days
  }

  return <div className="grid grid-cols-7 gap-2">{renderWeek()}</div>
}

export default WeekView