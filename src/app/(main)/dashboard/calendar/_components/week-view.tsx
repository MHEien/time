"use client"
import React from 'react'
import { motion } from 'framer-motion'
import type { CalendarEvent } from '@/types/calendar'
import { startOfWeek, endOfWeek, addDays, isSameDay } from 'date-fns'
import { getEventColor, getEventsForDay } from '@/lib/utils/event-utils'

interface WeekViewProps {
  currentDate: Date
  selectedDate: Date
  events: CalendarEvent[]
  onDateClick: (day: Date) => void
  onEventClick: (event: CalendarEvent) => void
  onDragStart: (event: CalendarEvent) => void
  onDragEnd: (day: Date) => void
}

const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  selectedDate,
  events,
  onDateClick,
  onEventClick,
  onDragStart,
  onDragEnd
}) => {
  const startDate = startOfWeek(currentDate)
  const endDate = endOfWeek(currentDate)

  const renderWeek = () => {
    const days = []
    let day = startDate
    while (day <= endDate) {
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
        </motion.div>
      )
      day = addDays(day, 1)
    }
    return days
  }

  return <div className="grid grid-cols-7 gap-2">{renderWeek()}</div>
}

export default WeekView