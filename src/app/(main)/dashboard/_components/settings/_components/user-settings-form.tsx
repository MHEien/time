'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { toast } from 'sonner'
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { TimePickerInput } from "@/components/ui/time-picker-input"
import { api } from '@/trpc/react'
import type { RouterOutputs } from '@/trpc/shared'

const formSchema = z.object({
    timeZone: z.string().min(1, { message: "Time zone is required" }),
    workingHoursStart: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Invalid time format" }),
    workingHoursEnd: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Invalid time format" }),
    weekStartDay: z.number().min(0).max(6),
    defaultActivityTrackingEnabled: z.boolean(),
    defaultCalendarSyncEnabled: z.boolean(),
  })

type UserSettings = RouterOutputs['userSettings']['mySettings']

export default function UserSettingsForm({ initialSettings }: { initialSettings: UserSettings }) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateUserSettings = api.userSettings.update.useMutation()

  const transformInitialSettings = (settings: UserSettings): z.infer<typeof formSchema> => ({
    timeZone: settings?.timeZone ?? '',
    workingHoursStart: settings?.workingHoursStart ?? '09:00',
    workingHoursEnd: settings?.workingHoursEnd ?? '17:00',
    weekStartDay: settings?.weekStartDay ?? 1, 
    defaultActivityTrackingEnabled: settings?.defaultActivityTrackingEnabled ?? false,
    defaultCalendarSyncEnabled: settings?.defaultCalendarSyncEnabled ?? false,
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: transformInitialSettings(initialSettings)
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      await updateUserSettings.mutateAsync(values)
      toast.success("Settings updated successfully")
    } catch (error) {
      toast.error("Failed to update settings")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="timeZone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Time Zone</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a time zone" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Choose your preferred time zone for the application.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="workingHoursStart"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Working Hours Start</FormLabel>
              <FormControl>
                <TimePickerInput {...field} />
              </FormControl>
              <FormDescription>
                Set the start time of your working hours.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="workingHoursEnd"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Working Hours End</FormLabel>
              <FormControl>
                <TimePickerInput {...field} />
              </FormControl>
              <FormDescription>
                Set the end time of your working hours.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="weekStartDay"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Week Start Day</FormLabel>
              <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value.toString()}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select start day of the week" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="0">Sunday</SelectItem>
                  <SelectItem value="1">Monday</SelectItem>
                  <SelectItem value="2">Tuesday</SelectItem>
                  <SelectItem value="3">Wednesday</SelectItem>
                  <SelectItem value="4">Thursday</SelectItem>
                  <SelectItem value="5">Friday</SelectItem>
                  <SelectItem value="6">Saturday</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Choose which day your week starts on.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="defaultActivityTrackingEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Activity Tracking</FormLabel>
                <FormDescription>
                  Enable activity tracking by default for new projects.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="defaultCalendarSyncEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Calendar Sync</FormLabel>
                <FormDescription>
                  Enable calendar synchronization by default for new projects.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Settings"}
        </Button>
      </form>
    </Form>
  )
}