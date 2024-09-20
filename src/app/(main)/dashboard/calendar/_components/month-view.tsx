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
  onEventClick: (event: CalendarEvent) => void
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
        {monthDays.map((day) => (
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
            {getEventsForDay(events, day).map(event => (
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
                onClick={(e) => {
                  e.stopPropagation()
                  onEventClick(event)
                }}
              >
                {event.title}
              </motion.div>
            ))}
            {aiSuggestions
              .filter(suggestion => isSameDay(suggestion.suggestedStartTime, day) && suggestion.status === 'pending')
              .map(suggestion => (
                <motion.div 
                  key={suggestion.id} 
                  className="text-xs bg-purple-500 text-white p-1 mt-1 rounded"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {suggestion.title}
                </motion.div>
              ))}
          </motion.div>
        ))}
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