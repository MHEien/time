import { addDays, startOfWeek, startOfMonth, endOfMonth, endOfWeek, isSameMonth, isSameDay, format } from 'date-fns'

export const getMonthDays = (currentDate: Date) => {
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const days = []
  let day = startDate
  while (day <= endDate) {
    days.push(day)
    day = addDays(day, 1)
  }

  return days
}

export const formatDate = (date: Date, formatString: string) => {
  return format(date, formatString)
}

export const isSameMonthDay = (date1: Date, date2: Date) => {
  return isSameMonth(date1, date2) && isSameDay(date1, date2)
}