"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface TimePickerInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string
}

export const TimePickerInput = React.forwardRef<HTMLInputElement, TimePickerInputProps>(
  ({ className, ...props }, ref) => {
    const [selectedTime, setSelectedTime] = React.useState(props.value as string || "")

    const minutes = React.useMemo(() => {
      return Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"))
    }, [])

    const hours = React.useMemo(() => {
      return Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"))
    }, [])

    const handleTimeChange = (newTime: string) => {
      setSelectedTime(newTime)
      if (props.onChange) {
        const event = {
          target: {
            name: props.name,
            value: newTime,
          },
        } as React.ChangeEvent<HTMLInputElement>
        props.onChange(event)
      }
    }

    return (
      <Popover>
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              ref={ref}
              type="text"
              value={selectedTime}
              onChange={(e) => handleTimeChange(e.target.value)}
              className={cn(
                "pl-8",
                className
              )}
              {...props}
            />
            <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0">
          <div className="flex h-48 flex-col">
            <div className="flex flex-1">
              <div className="flex flex-col p-2 overflow-y-auto border-r">
                <div className="font-semibold text-center mb-2">Hour</div>
                {hours.map((hour) => (
                  <Button
                    key={hour}
                    variant="ghost"
                    className="py-1"
                    onClick={() => {
                      const [, minute] = selectedTime.split(':')
                      handleTimeChange(`${hour}:${minute ?? '00'}`)
                    }}
                  >
                    {hour}
                  </Button>
                ))}
              </div>
              <div className="flex flex-col p-2 overflow-y-auto">
                <div className="font-semibold text-center mb-2">Minute</div>
                {minutes.map((minute) => (
                  <Button
                    key={minute}
                    variant="ghost"
                    className="py-1"
                    onClick={() => {
                      const [hour] = selectedTime.split(':')
                      handleTimeChange(`${hour ?? '00'}:${minute}`)
                    }}
                  >
                    {minute}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    )
  }
)

TimePickerInput.displayName = "TimePickerInput"