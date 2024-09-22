"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { ScrollArea } from '@/components/ui/scroll-area'
import type { CalendarEvent, AiSuggestion } from '@/types/calendar'
import { getEventColor } from '@/lib/utils/event-utils'

interface AgendaViewProps {
  selectedEvent?: CalendarEvent | AiSuggestion | null
  setSelectedEvent?: React.Dispatch<React.SetStateAction<CalendarEvent | AiSuggestion | null>>
  selectedDate?: Date
  selectedAgenda?: (CalendarEvent | AiSuggestion)[]
  setSelectedAgenda?: React.Dispatch<React.SetStateAction<(CalendarEvent | AiSuggestion)[]>>
  onSuggestionClick?: (suggestion: AiSuggestion) => void
}

const AgendaView: React.FC<AgendaViewProps> = ({
  selectedEvent,
  setSelectedEvent,
  selectedDate,
  selectedAgenda,
  setSelectedAgenda,
  onSuggestionClick
}) => {
  const sortEvents = (events: (CalendarEvent | AiSuggestion)[]): (CalendarEvent | AiSuggestion)[] => {
    return [...events].sort((a, b) => {
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

  const isAiSuggestion = (event: CalendarEvent | AiSuggestion): event is AiSuggestion => {
    return 'suggestedStartTime' in event
  }

  if (selectedEvent) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        className="fixed top-0 right-0 h-full w-80 bg-gradient-to-r from-gray-800 to-gray-900 shadow-lg p-4 overflow-y-auto z-50"
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2"
          onClick={() => setSelectedEvent && setSelectedEvent(null)}
        >
          <X className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold mb-4 text-indigo-300">{selectedEvent.title}</h2>
        <p className="mb-2">
          <strong className="text-emerald-300">Start:</strong> {format(isAiSuggestion(selectedEvent) ? selectedEvent.suggestedStartTime : selectedEvent.startTime, "PPpp")}
        </p>
        <p className="mb-2">
          <strong className="text-emerald-300">End:</strong> {format(isAiSuggestion(selectedEvent) ? selectedEvent.suggestedEndTime : selectedEvent.endTime, "PPpp")}
        </p>
        {!isAiSuggestion(selectedEvent) && (
          <p className="mb-2"><strong className="text-emerald-300">Location:</strong> {selectedEvent.location}</p>
        )}
        <p className="mb-4"><strong className="text-emerald-300">Description:</strong> {selectedEvent.description}</p>
        {isAiSuggestion(selectedEvent) ? (
          <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => onSuggestionClick && onSuggestionClick(selectedEvent)}>
            Add to Calendar
          </Button>
        ) : (
          <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => {
            // Implement edit functionality
            console.log("Edit functionality to be implemented")
          }}>
            Edit Event
          </Button>
        )}
      </motion.div>
    )
  }

  if (selectedAgenda && selectedAgenda.length > 0) {
    const sortedAgenda = sortEvents(selectedAgenda)
    return (
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-gray-800 to-gray-900 shadow-lg p-4 z-50 text-white"
      >
        <h2 className="text-2xl font-bold mb-4 text-indigo-300">Agenda for {selectedDate && format(selectedDate, "PPP")}</h2>
        <ScrollArea className="h-60">
          {sortedAgenda.map(event => (
            <div 
              key={isAiSuggestion(event) ? event.id : event.id} 
              className={`mb-4 p-2 rounded ${isAiSuggestion(event) ? 'bg-indigo-600' : getEventColor(event)} bg-opacity-80 cursor-pointer`}
              onClick={() => setSelectedEvent && setSelectedEvent(event)}
            >
              <h3 className="font-bold">{event.title}</h3>
              <p>
                {format(isAiSuggestion(event) ? event.suggestedStartTime : event.startTime, "p")} - 
                {format(isAiSuggestion(event) ? event.suggestedEndTime : event.endTime, "p")}
              </p>
              {!isAiSuggestion(event) && <p>{event.location}</p>}
              {isAiSuggestion(event) && <p className="text-xs mt-1">AI Suggestion</p>}
            </div>
          ))}
        </ScrollArea>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 text-white hover:text-indigo-300"
          onClick={() => setSelectedAgenda && setSelectedAgenda([])}
        >
          <X className="h-4 w-4" />
        </Button>
      </motion.div>
    )
  }

  return null
}

export default AgendaView