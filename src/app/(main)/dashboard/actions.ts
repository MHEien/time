"use server";
import { api } from "@/trpc/server";

export async function syncOutlookCalendar() {
  const response = await api.outlookCalendar.fetchEvents.query({});
  return response;
}

export async function syncGithub() {
  const response = await api.github.fetchData.query({});
  return response;
}