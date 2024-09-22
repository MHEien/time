"use client"
import React from 'react'
import { motion } from 'framer-motion'
import type { CalendarEvent, AiSuggestion } from '@/types/calendar'
import { getMonthDays, formatDate, isSameMonthDay } from '@/lib/utils/date-utils'
import { getEventColor, getEventsForDay } from '@/lib/utils/event-utils'
import { startOfWeek, addDays, isSameDay } from 'date-fns'

interface MonthViewProps {
  currentDate: Date
  selectedDate: Date
  events: CalendarEvent[]
  aiSuggestions: AiSuggestion[]
  onDateClick: (day: Date) => void
  onEventClick: (event: CalendarEvent | AiSuggestion) => void
  onDragStart: (event: CalendarEvent) => void
  onDragEnd: (day: Date) => void
}

const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  selectedDate,
  events,
  aiSuggestions,
  onDateClick,
  onEventClick,
  onDragStart,
  onDragEnd
}) => {
  const sortItems = (items: (CalendarEvent | AiSuggestion)[]): (CalendarEvent | AiSuggestion)[] => {
    return [...items].sort((a, b) => {
      const aStartTime = 'startTime' in a ? a.startTime : a.suggestedStartTime
      const bStartTime = 'startTime' in b ? b.startTime : b.suggestedStartTime
      const aEndTime = 'endTime' in a ? a.endTime : a.suggestedEndTime
      const bEndTime = 'endTime' in b ? b.endTime : b.suggestedEndTime

      // Sort by start time (ascending)
      if (aStartTime.getTime() !== bStartTime.getTime()) {
        return aStartTime.getTime() - bStartTime.getTime()
      }
      // If start times are the same, sort by duration (shortest first)
      const aDuration = aEndTime.getTime() - aStartTime.getTime()
      const bDuration = bEndTime.getTime() - bStartTime.getTime()
      return aDuration - bDuration
    })
  }

  const renderDays = () => {
    const dateFormat = "EEE"
    const days = []
    const startDate = startOfWeek(currentDate)
    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center font-bold text-gray-500">
          {formatDate(addDays(startDate, i), dateFormat)}
        </div>
      )
    }
    return <div className="grid grid-cols-7 gap-2 mb-2">{days}</div>
  }

  const renderCells = () => {
    const monthDays = getMonthDays(currentDate)
    return (
      <div className="grid grid-cols-7 gap-2">
        {monthDays.map((day) => {
          const dayEvents = getEventsForDay(events, day)
          const daySuggestions = aiSuggestions.filter(suggestion => 
            isSameDay(suggestion.suggestedStartTime, day) && suggestion.status === 'pending'
          )
          const sortedItems = sortItems([...dayEvents, ...daySuggestions])

          return (
            <motion.div
              key={day.toString()}
              className={`min-h-[100px] border rounded-lg p-2 ${
                !isSameMonthDay(day, currentDate)
                  ? "text-gray-200 bg-gray-100"
                  : isSameDay(day, selectedDate)
                  ? "bg-indigo-100"
                  : "bg-white"
              } hover:shadow-lg transition-all duration-300 text-gray-500`}
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
              <span className="text-sm font-semibold">{formatDate(day, 'd')}</span>
              {sortedItems.map(item => {
                const isAiSuggestion = 'suggestedStartTime' in item
                return (
                  <motion.div 
                    key={item.id} 
                    className={`text-xs ${isAiSuggestion ? 'bg-purple-500' : getEventColor(item)} text-white p-1 mt-1 rounded ${isAiSuggestion || (item).externalCalendarId ? 'cursor-pointer' : 'cursor-move'}`}
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
                    {item.title} {isAiSuggestion && '(AI)'}
                  </motion.div>
                )
              })}
            </motion.div>
          )
        })}
      </div>
    )
  }

  return (
    <>
      {renderDays()}
      {renderCells()}
    </>
  )
}

export default MonthView