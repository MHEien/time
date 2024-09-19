'use client'

import { useState } from 'react'
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { api } from '@/trpc/react'
import type { RouterOutputs } from '@/trpc/shared'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { motion } from "framer-motion"
import { BackgroundGradient } from "@/components/ui/background-gradient"
import { HoverEffect } from "@/components/ui/card-hover-effect"

type CalendarEvent = RouterOutputs['calendar']['myEvents'][number]
type AiSuggestion = RouterOutputs['aiSuggestions']['myEvents'][number]

export default function CalendarPage({ initialEvents, initialAiSuggestions }: { initialEvents: CalendarEvent[], initialAiSuggestions: AiSuggestion[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
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

  const router = useRouter()
  const createdEvent = api.calendar.create.useMutation()

  const onDateClick = (day: Date) => {
    setSelectedDate(day)
  }

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'bg-red-500'
    if (priority >= 5) return 'bg-yellow-500'
    return 'bg-green-500'
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

  const renderHeader = () => {
    const dateFormat = "MMMM yyyy"
    return (
      <motion.div 
        className="flex items-center justify-between py-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Button variant="outline" size="icon" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
          {format(currentMonth, dateFormat)}
        </span>
        <Button variant="outline" size="icon" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </motion.div>
    )
  }

  const renderDays = () => {
    const dateFormat = "EEE"
    const days = []
    const startDate = startOfWeek(currentMonth)
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
    const monthStart = startOfMonth(currentMonth)
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
                ? "text-gray-400 bg-gray-100"
                : isSameDay(day, selectedDate)
                ? "bg-blue-100"
                : "bg-white"
            } hover:shadow-lg transition-all duration-300`}
            onClick={() => onDateClick(cloneDay)}
            whileHover={{ scale: 1.05 }}
          >
            <span className="text-sm font-semibold">{formattedDate}</span>
            {events
              .filter(event => isSameDay(event.startTime, cloneDay))
              .map(event => (
                <motion.div 
                  key={event.id} 
                  className="text-xs bg-blue-500 text-white p-1 mt-1 rounded"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {event.title}
                </motion.div>
              ))}
            {aiSuggestions
              .filter(suggestion => isSameDay(suggestion.suggestedStartTime, cloneDay) && suggestion.status === 'pending')
              .map(suggestion => (
                <motion.div 
                  key={suggestion.id} 
                  className={`text-xs ${getPriorityColor(suggestion.priority ?? 1)} text-white p-1 mt-1 rounded`}
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

  return (
    <div className="w-full h-full p-4 bg-gradient-to-br from-gray-900 to-gray-800">
      <BackgroundGradient className="rounded-[22px] w-full p-4 sm:p-10 bg-white dark:bg-zinc-900">
        <Card className="w-full h-full bg-transparent">
          <CardHeader>
            <CardTitle className="text-4xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
              Your AI Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderHeader()}
            {renderDays()}
            {renderCells()}
            <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="mr-2 h-4 w-4" /> Add Event
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
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
                      value={newEvent.description ?? ''}
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
                      value={format(newEvent.startTime ?? new Date(), "yyyy-MM-dd'T'HH:mm")}
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
                      value={format(newEvent.endTime ?? new Date(), "yyyy-MM-dd'T'HH:mm")}
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
                      checked={!!newEvent.isAllDay}
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
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4 text-white">AI Suggestions</h2>
        <HoverEffect items={aiSuggestions.map(suggestion => ({
          title: suggestion.title,
          description: suggestion.description ?? '',
          link: '#'
        }))} />
      </div>
    </div>
  )
}