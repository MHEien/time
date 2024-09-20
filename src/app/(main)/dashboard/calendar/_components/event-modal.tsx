"use client"
import React from 'react'
import { format } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import type { NewEvent } from '@/types/calendar'

interface EventModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  newEvent: NewEvent
  setNewEvent: React.Dispatch<React.SetStateAction<NewEvent>>
  handleAddEvent: () => void
}

const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onOpenChange,
  newEvent,
  setNewEvent,
  handleAddEvent
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
              value={newEvent.description}
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
              value={format(newEvent.startTime, "yyyy-MM-dd'T'HH:mm")}
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
              value={format(newEvent.endTime, "yyyy-MM-dd'T'HH:mm")}
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
              value={newEvent.location}
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
              checked={newEvent.isAllDay}
              onCheckedChange={(checked) => setNewEvent({ ...newEvent, isAllDay: checked })}
            />
          </div>
        </div>
        <Button onClick={handleAddEvent}>Add Event</Button>
      </DialogContent>
    </Dialog>
  )
}

export default EventModal