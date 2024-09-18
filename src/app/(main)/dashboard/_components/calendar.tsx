'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, momentLocalizer, Views, View } from 'react-big-calendar'
import moment from 'moment'
import { format, parseISO } from 'date-fns'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { PlusCircle, ChevronLeft, ChevronRight } from 'lucide-react'

// Assuming you have a function to fetch events from your API
import { api } from '@/trpc/react'
import GenerateSuggestion from './generate-suggestion'

// Set up the localizer for react-big-calendar
const localizer = momentLocalizer(moment)

// Define the Event type based on your schema
type Event = {
  id: string
  title: string
  description?: string
  start: Date
  end: Date
  location?: string
  allDay: boolean
  color?: string
}

interface ToolBarProps {
  onView: (view: View) => void
  onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY') => void
  label: string
}

const CustomToolbar = ({ onView, onNavigate, label }: ToolBarProps) => (
  <div className="flex justify-between items-center mb-4 p-2 bg-secondary rounded-lg">
    <div>
      <Button variant="outline" onClick={() => onNavigate('PREV')} className="mr-2">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button variant="outline" onClick={() => onNavigate('NEXT')}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
    <h2 className="text-xl font-semibold">{label}</h2>
    <div>
      <Select onValueChange={(value) => onView(value as View)} defaultValue={Views.MONTH}>
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Select view" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={Views.DAY}>Day</SelectItem>
          <SelectItem value={Views.WEEK}>Week</SelectItem>
          <SelectItem value={Views.MONTH}>Month</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
)

export default function CalendarComponent() {
  
  const events = api.calendar.myEvents.useQuery({})

  const formatEvent = (event: any): Event => {
    return {
      id: event.id,
      title: event.title,
      start: new Date(event.startTime),
      end: new Date(event.endTime),
      allDay: event.isAllDay,
      color: getRandomColor(),
      description: event.description,
      location: event.location,
    }
  }

  const getRandomColor = () => {
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500']
    return colors[Math.floor(Math.random() * colors.length)]
  }

  const eventStyleGetter = (event: Event) => {
    return {
      className: `${event.color} text-white rounded-md p-1`,
      style: {
        border: 'none',
      },
    }
  }

  return (
    <div className="container mx-auto p-4 h-screen flex flex-col">
      <Card className="flex-grow overflow-hidden">
        <CardContent className="p-0 h-full">
          <Calendar
            localizer={localizer}
            events={events.data?.map(formatEvent) ?? []}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            views={[Views.MONTH, Views.WEEK, Views.DAY]}
            defaultView={Views.MONTH}
            tooltipAccessor={(event) => `${event.title}${event.description ? `: ${event.description}` : ''}`}
            eventPropGetter={eventStyleGetter}
            components={{
              toolbar: CustomToolbar,
            }}
          />
        </CardContent>
      </Card>
      <GenerateSuggestion />
    </div>
  )
}