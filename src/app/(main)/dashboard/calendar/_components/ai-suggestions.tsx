import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { AiSuggestion, CalendarEvent } from '@/types/calendar'

interface AISuggestionsProps {
  isSuggestionsOpen: boolean
  setIsSuggestionsOpen: React.Dispatch<React.SetStateAction<boolean>>
  aiSuggestions: AiSuggestion[]
  events: CalendarEvent[]
  onSuggestionClick: (suggestion: AiSuggestion) => void
  onSuggestionDrag: (suggestion: AiSuggestion, day: Date, hour?: number) => void
}

const AISuggestions: React.FC<AISuggestionsProps> = ({
  isSuggestionsOpen,
  setIsSuggestionsOpen,
  aiSuggestions,
  events,
  onSuggestionClick,
  onSuggestionDrag
}) => {
  const isSuggestionInCalendar = (suggestion: AiSuggestion) => {
    return events.some(event => event.title === suggestion.title)
  }

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, suggestion: AiSuggestion) => {
    if (!isSuggestionInCalendar(suggestion)) {
      e.dataTransfer.setData('text/plain', JSON.stringify(suggestion))
    }
  }

  return (
    <div className="flex flex-col relative">
      <Button
        onClick={() => setIsSuggestionsOpen(!isSuggestionsOpen)}
        className="mb-2 self-end z-10"
      >
        {isSuggestionsOpen ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronUp className="h-4 w-4 mr-2" />}
        {isSuggestionsOpen ? 'Hide Suggestions' : 'Show Suggestions'}
      </Button>
      <AnimatePresence>
        {isSuggestionsOpen && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="absolute top-12 right-0 h-[calc(100vh-200px)] w-80 bg-white dark:bg-gray-800 shadow-lg p-4 overflow-y-auto z-50 text-foreground"
          >
            <ScrollArea className="h-full pr-4">
              {aiSuggestions.map((suggestion, index) => {
                const isInCalendar = isSuggestionInCalendar(suggestion)
                return (
                  <div
                    key={index}
                    className={`p-4 mb-4 rounded-lg bg-gray-100 dark:bg-gray-700 cursor-pointer transition-all ${
                      isInCalendar ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    onClick={() => !isInCalendar && onSuggestionClick(suggestion)}
                    draggable={!isInCalendar}
                    onDragStart={(e) => handleDragStart(e, suggestion)}
                  >
                    <h3 className="font-semibold mb-2">{suggestion.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{suggestion.description}</p>
                  </div>
                )
              })}
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AISuggestions