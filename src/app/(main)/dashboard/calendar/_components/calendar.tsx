"use client"
import React, { useMemo, useState } from 'react'
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, isSameDay } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, RefreshCcw } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BackgroundGradient } from "@/components/ui/background-gradient"
import { SparklesCore } from '@/components/ui/sparkles'
import { TextGenerateEffect } from '@/components/ui/text-generate-effect'
import { api } from '@/trpc/react'
import type { CalendarEvent, AiSuggestion, ViewType, NewEvent } from '@/types/calendar'
import MonthView from './month-view'
import WeekView from './week-view'
import DayView from './day-view'
import EventModal from './event-modal'
import AgendaView from './agenda-view'
import AISuggestions from './ai-suggestions'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { syncOutlookCalendar, syncGithub } from '../../actions'

interface CalendarPageProps {
  initialEvents: CalendarEvent[]
  initialAiSuggestions: AiSuggestion[]
}

const CalendarPage: React.FC<CalendarPageProps> = ({ initialEvents, initialAiSuggestions }) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [isAddEventOpen, setIsAddEventOpen] = useState(false)
  const [newEvent, setNewEvent] = useState<NewEvent>({
    title: '',
    description: '',
    startTime: new Date(),
    endTime: new Date(),
    location: '',
    isAllDay: false,
  })
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [selectedAgenda, setSelectedAgenda] = useState<CalendarEvent[]>([])
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null)
  const [viewType, setViewType] = useState<ViewType>('month')

  const { mutateAsync, isLoading } = api.aiSuggestions.generateWorkSchedule.useMutation()

  const router = useRouter();

  const aiSuggestions = useMemo(() => {
    return initialAiSuggestions.filter(suggestion => suggestion.status === 'pending')
  }, [initialAiSuggestions])

  const createdEvent = api.calendar.create.useMutation()

  const onDateClick = (day: Date) => {
    setSelectedDate(day)
    const agenda = events.filter(event => isSameDay(event.startTime, day))
    setSelectedAgenda(agenda)
    setSelectedEvent(null)
  }

  const nextPeriod = () => {
    switch (viewType) {
      case 'month':
        setCurrentDate(addMonths(currentDate, 1))
        break
      case 'week':
        setCurrentDate(addWeeks(currentDate, 1))
        break
      case 'day':
        setCurrentDate(addDays(currentDate, 1))
        break
    }
  }

  const prevPeriod = () => {
    switch (viewType) {
      case 'month':
        setCurrentDate(subMonths(currentDate, 1))
        break
      case 'week':
        setCurrentDate(subWeeks(currentDate, 1))
        break
      case 'day':
        setCurrentDate(subDays(currentDate, 1))
        break
    }
  }

  const handleAddEvent = async () => {
    try {
      await createdEvent.mutateAsync({
        title: newEvent.title,
        description: newEvent.description,
        startTime: newEvent.startTime.toISOString(),
        endTime: newEvent.endTime.toISOString(),
        location: newEvent.location,
        isAllDay: newEvent.isAllDay,
        recurrenceRule: newEvent.recurrenceRule ?? '',
        externalCalendarId: newEvent.externalCalendarId ?? undefined,
      })
      setEvents([...events, newEvent as CalendarEvent])
      setIsAddEventOpen(false)
      setNewEvent({
        title: '',
        description: '',
        startTime: new Date(),
        endTime: new Date(),
        location: '',
        isAllDay: false,
      })
      toast.success("Event created")
      router.refresh()
      setTimeout(() => {
        router.push(`/dashboard/calendar`)
      }, 100)
    } catch (error) {
      toast.error("Failed to create event")
      setIsAddEventOpen(false)
      setNewEvent({
        title: '',
        description: '',
        startTime: new Date(),
        endTime: new Date(),
        location: '',
        isAllDay: false,
      })
    }
  }

  const handleSuggestionClick = (suggestion: AiSuggestion) => {
    const newEventFromSuggestion: NewEvent = {
      title: suggestion.title,
      description: suggestion.description ?? '',
      startTime: suggestion.suggestedStartTime,
      endTime: suggestion.suggestedEndTime,
      isAllDay: false,
      location: '',
    }
    setNewEvent(newEventFromSuggestion)
    setIsAddEventOpen(true)
  }

  const handleSuggestionDrag = (suggestion: AiSuggestion, day: Date, hour?: number) => {
    const newStartTime = hour !== undefined
      ? new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour)
      : new Date(day.getFullYear(), day.getMonth(), day.getDate(), suggestion.suggestedStartTime.getHours(), suggestion.suggestedStartTime.getMinutes())

    const duration = suggestion.suggestedEndTime.getTime() - suggestion.suggestedStartTime.getTime()
    const newEndTime = new Date(newStartTime.getTime() + duration)

    const newEventFromSuggestion: NewEvent = {
      title: suggestion.title,
      description: suggestion.description ?? '',
      startTime: newStartTime,
      endTime: newEndTime,
      isAllDay: false,
      location: '',
    }

    setNewEvent(newEventFromSuggestion)
    setIsAddEventOpen(true)
  }

  const handleDragStart = (event: CalendarEvent) => {
    if (event.externalCalendarId) return
    setDraggedEvent(event)
  }


  const handleDragEnd = (day: Date, hour?: number) => {
    if (draggedEvent && !draggedEvent.externalCalendarId) {
      let newStartTime: Date
      let newEndTime: Date

      if (hour !== undefined) {
        newStartTime = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour)
        const duration = draggedEvent.endTime.getTime() - draggedEvent.startTime.getTime()
        newEndTime = new Date(newStartTime.getTime() + duration)
      } else {
        newStartTime = new Date(day.getFullYear(), day.getMonth(), day.getDate(), draggedEvent.startTime.getHours(), draggedEvent.startTime.getMinutes())
        newEndTime = new Date(day.getFullYear(), day.getMonth(), day.getDate(), draggedEvent.endTime.getHours(), draggedEvent.endTime.getMinutes())
      }

      const updatedEvent = {
        ...draggedEvent,
        startTime: newStartTime,
        endTime: newEndTime
      }

      setEvents(events.map(e => e.id === updatedEvent.id ? updatedEvent : e))
      setDraggedEvent(null)
      toast.success("Event moved successfully")
    }
  }

  const renderHeader = () => {
    let dateFormat = "MMMM yyyy"
    if (viewType === 'week') dateFormat = "MMMM d, yyyy"
    if (viewType === 'day') dateFormat = "MMMM d, yyyy"
    return (
      <motion.div 
        className="flex items-center justify-between py-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Button variant="outline" size="icon" onClick={prevPeriod}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-emerald-500">
          {format(currentDate, dateFormat)}
        </span>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={nextPeriod}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => syncOutlookCalendar().then(() => router.refresh())}>
                Sync with Outlook
              </DropdownMenuItem>
              /*
              <DropdownMenuItem onClick={() => syncGithub().then(() => router.refresh())}>
                Sync with Google Calendar
              </DropdownMenuItem>
              */
            </DropdownMenuContent>
          </DropdownMenu>
          <button className="ml-auto" 
          disabled={isLoading}
          onClick={() => 
          mutateAsync({}).then(() => router.refresh())
          }>
            Generate Schedule
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="w-full h-full p-4 bg-gradient-to-br from-gray-900 to-gray-800 flex">
      <div className="flex-grow mr-4">
        <BackgroundGradient className="rounded-[22px] w-full p-4 sm:p-10 bg-white dark:bg-zinc-900">
          <Card className="w-full h-full bg-transparent">
            <CardHeader>
              <CardTitle className="text-4xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-emerald-500">
                <TextGenerateEffect words="Your AI Calendar" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                {renderHeader()}
                <Select value={viewType} onValueChange={(value: ViewType) => setViewType(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select view" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="day">Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {viewType === 'month' && (
                <MonthView
                  currentDate={currentDate}
                  selectedDate={selectedDate}
                  events={events}
                  aiSuggestions={aiSuggestions}
                  onDateClick={onDateClick}
                  onEventClick={setSelectedEvent}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                />
              )}
              {viewType === 'week' && (
                <WeekView
                  currentDate={currentDate}
                  selectedDate={selectedDate}
                  events={events}
                  onDateClick={onDateClick}
                  onEventClick={setSelectedEvent}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                />
              )}
              {viewType === 'day' && (
                <DayView
                  currentDate={currentDate}
                  events={events}
                  onEventClick={setSelectedEvent}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                />
              )}
              <EventModal
                isOpen={isAddEventOpen}
                onOpenChange={setIsAddEventOpen}
                newEvent={newEvent}
                setNewEvent={setNewEvent}
                handleAddEvent={handleAddEvent}
              />
            </CardContent>
          </Card>
        </BackgroundGradient>
      </div>
      <AISuggestions
        isSuggestionsOpen={isSuggestionsOpen}
        setIsSuggestionsOpen={setIsSuggestionsOpen}
        aiSuggestions={aiSuggestions}
        events={events}
        onSuggestionClick={handleSuggestionClick}
        onSuggestionDrag={handleSuggestionDrag}
      />
      <AnimatePresence>
        {selectedEvent && (
          <AgendaView
            selectedEvent={selectedEvent}
            setSelectedEvent={setSelectedEvent}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selectedAgenda.length > 0 && (
          <AgendaView
            selectedDate={selectedDate}
            selectedAgenda={selectedAgenda}
            setSelectedAgenda={setSelectedAgenda}
          />
        )}
      </AnimatePresence>
      <SparklesCore
        id="tsparticlesfullpage"
        background="transparent"
        minSize={0.6}
        maxSize={1.4}
        particleDensity={100}
        className="w-full h-full fixed top-0 left-0 pointer-events-none"
        particleColor="#FFFFFF"
      />
    </div>
  )
}

export default CalendarPage