"use server";
import { api } from "@/trpc/server";

export async function syncOutlookCalendar() {
  const response = await api.outlookCalendar.fetchEvents.query({});
  return response;
}