  'use client'

  import { useState } from 'react'
  import { format, startOfWeek, addDays, startOfMonth, endOfMonth, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths, startOfDay, endOfDay, addWeeks, subWeeks, subDays, isWithinInterval, addHours } from 'date-fns'
  import { ChevronLeft, ChevronRight, Plus, ChevronDown, ChevronUp, X } from 'lucide-react'
  import { Button } from "@/components/ui/button"
  import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
  import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
  import { Input } from "@/components/ui/input"
  import { Label } from "@/components/ui/label"
  import { Textarea } from "@/components/ui/textarea"
  import { Switch } from "@/components/ui/switch"
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
  import { api } from '@/trpc/react'
  import type { RouterOutputs } from '@/trpc/shared'
  import { toast } from 'sonner'
  import { useRouter } from 'next/navigation'
  import { AnimatePresence, motion, useAnimation } from "framer-motion"
  import { BackgroundGradient } from "@/components/ui/background-gradient"
  import { HoverEffect } from "@/components/ui/card-hover-effect"
  import { ScrollArea } from '@/components/ui/scroll-area'
  import { TextGenerateEffect } from '@/components/ui/text-generate-effect'
  import { SparklesCore } from '@/components/ui/sparkles'

  type CalendarEvent = RouterOutputs['calendar']['myEvents'][number]
  type AiSuggestion = RouterOutputs['aiSuggestions']['myEvents'][number]

  type ViewType = 'month' | 'week' | 'day'

  export default function CalendarPage({ initialEvents, initialAiSuggestions }: { initialEvents: CalendarEvent[], initialAiSuggestions: AiSuggestion[] }) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
    const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>(initialAiSuggestions)
    const [isAddEventOpen, setIsAddEventOpen] = useState(false)
    const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
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
    const [isDragging, setIsDragging] = useState(false)
    const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null)
    const [viewType, setViewType] = useState<ViewType>('month')

    const router = useRouter()
    const createdEvent = api.calendar.create.useMutation()
    const dragControls = useAnimation()

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

    const getEventColor = (event: CalendarEvent) => {
      if (event.externalCalendarId) return 'bg-indigo-500'
      return 'bg-emerald-500'
    }

    const handleAddEvent = async () => {
      try {
        await createdEvent.mutateAsync({
          title: newEvent.title!,
          description: newEvent.description!,
          startTime: newEvent.startTime!.toISOString(),
          endTime: newEvent.endTime!.toISOString(),
          location: newEvent.location!,
          isAllDay: newEvent.isAllDay ?? false,
          recurrenceRule: newEvent.recurrenceRule ?? '',
          externalCalendarId: newEvent.externalCalendarId ?? undefined,
        });
        setEvents([...events, newEvent as CalendarEvent]);
        setIsAddEventOpen(false);
        setNewEvent({
          title: '',
          description: '',
          startTime: new Date(),
          endTime: new Date(),
          location: '',
          isAllDay: false,
        });
        toast.success("Event created");
        router.refresh();
        setTimeout(() => {
          router.push(`/dashboard/calendar`);
        }, 100);
      } catch (error) {
        toast.error("Failed to create event");
        setIsAddEventOpen(false);
        setNewEvent({
          title: '',
          description: '',
          startTime: new Date(),
          endTime: new Date(),
          location: '',
          isAllDay: false,
        });
      }
    };

    const handleDragStart = (event: CalendarEvent) => {
      if (event.externalCalendarId) return
      setIsDragging(true)
      setDraggedEvent(event)
    }

    const handleDragEnd = (day: Date, hour?: number) => {
      if (draggedEvent && !draggedEvent.externalCalendarId) {
        let newStartTime: Date
        let newEndTime: Date

        if (hour !== undefined) {
          // For day view, set the new time to the dropped hour
          newStartTime = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour)
          const duration = draggedEvent.endTime.getTime() - draggedEvent.startTime.getTime()
          newEndTime = new Date(newStartTime.getTime() + duration)
        } else {
          // For month and week views, keep the time but change the date
          newStartTime = new Date(day.getFullYear(), day.getMonth(), day.getDate(), draggedEvent.startTime.getHours(), draggedEvent.startTime.getMinutes())
          newEndTime = new Date(day.getFullYear(), day.getMonth(), day.getDate(), draggedEvent.endTime.getHours(), draggedEvent.endTime.getMinutes())
        }

        const updatedEvent = {
          ...draggedEvent,
          startTime: newStartTime,
          endTime: newEndTime
        }

        setEvents(events.map(e => e.id === updatedEvent.id ? updatedEvent : e))
        setIsDragging(false)
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
          <Button variant="outline" size="icon" onClick={nextPeriod}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </motion.div>
      )
    }

    const renderDays = () => {
      const dateFormat = "EEE"
      const days = []
      const startDate = startOfWeek(currentDate)
      for (let i = 0; i < 7; i++) {
        days.push(
          <div key={i} className="text-center font-bold text-gray-500">
            {format(addDays(startDate, i), dateFormat)}
          </div>
        )
      }
      return <div className="grid grid-cols-7 gap-2 mb-2">{days}</div>
    }

    const renderCells = () => {
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(monthStart)
      const startDate = startOfWeek(monthStart)
      const endDate = endOfWeek(monthEnd)
      const dateFormat = "d"
      const rows = []
      let days = []
      let day = startDate
      let formattedDate = ""
      while (day <= endDate) {
        for (let i = 0; i < 7; i++) {
          formattedDate = format(day, dateFormat)
          const cloneDay = day
          days.push(
            <motion.div
              key={day.toString()}
              className={`min-h-[100px] border rounded-lg p-2 ${
                !isSameMonth(day, monthStart)
                  ? "text-gray-200 bg-gray-100"
                  : isSameDay(day, selectedDate)
                  ? "bg-indigo-100"
                  : "bg-white"
              } hover:shadow-lg transition-all duration-300 text-gray-500`}
              onClick={() => onDateClick(cloneDay)}
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
                handleDragEnd(cloneDay)
              }}
            >
              <span className="text-sm font-semibold">{formattedDate}</span>
              {events
                .filter(event => isSameDay(event.startTime, cloneDay))
                .map(event => (
                  <motion.div 
                    key={event.id} 
                    className={`text-xs ${getEventColor(event)} text-white p-1 mt-1 rounded ${event.externalCalendarId ? 'cursor-default' : 'cursor-move'}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    draggable={!event.externalCalendarId}
                    onDragStart={(e) => {
                      e.stopPropagation()
                      if (!event.externalCalendarId) handleDragStart(event)
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedEvent(event)
                      console.log("Selected event: ", event)
                      setSelectedAgenda([])
                    }}
                  >
                    {event.title}
                  </motion.div>
                ))}
              {aiSuggestions
                .filter(suggestion => isSameDay(suggestion.suggestedStartTime, cloneDay) && suggestion.status === 'pending')
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
          )
          day = addDays(day, 1)
        }
        rows.push(
          <div key={day.toString()} className="grid grid-cols-7 gap-2">
            {days}
          </div>
        )
        days = []
      }
      return <div className="mb-4">{rows}</div>
    }

    const renderWeekView = () => {
      const startDate = startOfWeek(currentDate)
      const endDate = endOfWeek(currentDate)
      const dateFormat = "EEE d"
      const rows = []
      let day = startDate
      while (day <= endDate) {
        rows.push(
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
              handleDragEnd(day)
            }}
          >
            <span className="text-sm font-semibold">{format(day, dateFormat)}</span>
            {events
              .filter(event => isSameDay(event.startTime, day))
              .map(event => (
                <motion.div 
                  key={event.id} 
                  className={`text-xs ${getEventColor(event)} text-white p-1 mt-1 rounded ${event.externalCalendarId ? 'cursor-default' : 'cursor-move'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  draggable={!event.externalCalendarId}
                  onDragStart={(e) => {
                    e.stopPropagation()
                    if (!event.externalCalendarId) handleDragStart(event)
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedEvent(event)
                    setSelectedAgenda([])
                  }}
                >
                  {event.title}
                </motion.div>
              ))}
          </motion.div>
        )
        day = addDays(day, 1)
      }
      return <div className="grid grid-cols-7 gap-2">{rows}</div>
    }

    const renderDayView = () => {
      const startOfDayDate = startOfDay(currentDate)
      const endOfDayDate = endOfDay(currentDate)
      const hours = []
      for (let i = 0; i < 24; i++) {
        const hour = addHours(startOfDayDate, i)
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
              handleDragEnd(currentDate)
            }}
          >
            <span className="text-sm font-semibold">{format(hour, 'HH:mm')}</span>
            {events
              .filter(event => isWithinInterval(event.startTime, { start: hour, end: addHours(hour, 1) }))
              .map(event => (
                <motion.div 
                  key={event.id} 
                  className={`text-xs ${getEventColor(event)} text-white p-1 mt-1 rounded ${event.externalCalendarId ? 'cursor-default' : 'cursor-move'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  draggable={!event.externalCalendarId}
                  onDragStart={(e) => {
                    e.stopPropagation()
                    if (!event.externalCalendarId) handleDragStart(event)
                  }}
                  onClick={() => setSelectedEvent(event)}
                >
                  {event.title}
                </motion.div>
              ))}
          </motion.div>
        )
      }
      return <div className="overflow-y-auto max-h-[calc(100vh-200px)]">{hours}</div>
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
                  <>
                    {renderDays()}
                    {renderCells()}
                  </>
                )}
                {viewType === 'week' && renderWeekView()}
                {viewType === 'day' && renderDayView()}
                <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <Plus className="mr-2 h-4 w-4" /> Add Event
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Event</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right">
                          Title
                        </Label>
                        <Input
                          id="title"
                          value={newEvent.title}
                          onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">
                          Description
                        </Label>
                        <Textarea
                          id="description"
                          value={newEvent.description ?? ""}
                          onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="startTime" className="text-right">
                          Start Time
                        </Label>
                        <Input
                          id="startTime"
                          type="datetime-local"
                          value={format(newEvent.startTime!, "yyyy-MM-dd'T'HH:mm")}
                          onChange={(e) => setNewEvent({ ...newEvent, startTime: new Date(e.target.value) })}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="endTime" className="text-right">
                          End Time
                        </Label>
                        <Input
                          id="endTime"
                          type="datetime-local"
                          value={format(newEvent.endTime!, "yyyy-MM-dd'T'HH:mm")}
                          onChange={(e) => setNewEvent({ ...newEvent, endTime: new Date(e.target.value) })}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="location" className="text-right">
                          Location
                        </Label>
                        <Input
                          id="location"
                          value={newEvent.location ?? ''}
                          onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="isAllDay" className="text-right">
                          All Day
                        </Label>
                        <Switch
                          id="isAllDay"
                          checked={newEvent.isAllDay ?? false}
                          onCheckedChange={(checked) => setNewEvent({ ...newEvent, isAllDay: checked })}
                        />
                      </div>
                    </div>
                    <Button onClick={handleAddEvent}>Add Event</Button>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </BackgroundGradient>
        </div>
        <div className="w-64 flex flex-col">
          <Button
            onClick={() => setIsSuggestionsOpen(!isSuggestionsOpen)}
            className="mb-2 self-end"
          >
            {isSuggestionsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            {isSuggestionsOpen ? 'Hide Suggestions' : 'Show Suggestions'}
          </Button>
          <AnimatePresence>
              {selectedEvent && (
                <motion.div
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 100 }}
                  className="fixed top-0 right-0 h-full w-80 bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg p-4 overflow-y-auto z-50 text-white"
                >
                <ScrollArea className="h-[calc(100vh-200px)] pr-4">
                  <h2 className="text-2xl font-bold mb-4 text-white">AI Suggestions</h2>
                  <HoverEffect 
                    columns={1}
                    items={aiSuggestions.map(suggestion => ({
                      title: suggestion.title,
                      description: suggestion.description ?? '',
                      link: '#',
                    }))}
                  />
                </ScrollArea>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence>
          {selectedEvent && (
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
                onClick={() => setSelectedEvent(null)}
              >
                <X className="h-4 w-4" />
              </Button>
              <h2 className="text-2xl font-bold mb-4 text-indigo-300">{selectedEvent.title}</h2>
        <p className="mb-2"><strong className="text-emerald-300">Start:</strong> {format(selectedEvent.startTime, "PPpp")}</p>
        <p className="mb-2"><strong className="text-emerald-300">End:</strong> {format(selectedEvent.endTime, "PPpp")}</p>
        <p className="mb-2"><strong className="text-emerald-300">Location:</strong> {selectedEvent.location}</p>
        <p className="mb-4"><strong className="text-emerald-300">Description:</strong> {selectedEvent.description}</p>
        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => {
          // Implement edit functionality
          toast.info("Edit functionality to be implemented")
        }}>
          Edit Event
        </Button>
      </motion.div>
    )}
  </AnimatePresence>

  <AnimatePresence>
    {selectedAgenda.length > 0 && (
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-gray-800 to-gray-900 shadow-lg p-4 z-50 text-white"
      >
        <h2 className="text-2xl font-bold mb-4 text-indigo-300">Agenda for {format(selectedDate, "PPP")}</h2>
        <ScrollArea className="h-60">
          {selectedAgenda.map(event => (
            <div key={event.id} className={`mb-4 p-2 rounded ${getEventColor(event)} bg-opacity-80`}>
              <h3 className="font-bold">{event.title}</h3>
              <p>{format(event.startTime, "p")} - {format(event.endTime, "p")}</p>
              <p>{event.location}</p>
            </div>
          ))}
        </ScrollArea>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 text-white hover:text-indigo-300"
          onClick={() => setSelectedAgenda([])}
        >
          <X className="h-4 w-4" />
        </Button>
      </motion.div>
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