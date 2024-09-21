import { Client } from "@microsoft/microsoft-graph-client";
import type { OutlookCalendarEvent, OutlookCalendarResponse } from "@/types/outlook";

function createGraphClient(accessToken: string): Client {
  const authProvider = {
    getAccessToken: async () => accessToken
  };
  
  return Client.initWithMiddleware({ authProvider });
}

export async function getUserCalendar(
  accessToken: string, 
  userEmail: string, 
  startDate: Date, 
  endDate: Date
): Promise<OutlookCalendarEvent[]> {
  try {
    const graphClient = createGraphClient(accessToken);
    
    const startDateTime = startDate.toISOString();
    const endDateTime = endDate.toISOString();
    
    let allEvents: OutlookCalendarEvent[] = [];
    let nextLink: string | null = null;

    do {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const response: OutlookCalendarResponse = nextLink
        ? await graphClient.api(nextLink).get()
        : await graphClient
            .api(`/users/${userEmail}/calendar/calendarView`)
            .query(`startDateTime=${startDateTime}&endDateTime=${endDateTime}`)
            .select('subject,start,end,organizer')
            .orderby('start/dateTime')
            .top(999) // Request the maximum number of items per page
            .get();

      allEvents = allEvents.concat(response.value);
      nextLink = response["@odata.nextLink"] || null;
    } while (nextLink);

    return allEvents;
  } catch (error) {
    console.error("Error fetching user calendar:", error);
    throw error;
  }
}

// Usage example remains the same
export async function fetchCalendarEvents(accessToken: string, userEmail: string): Promise<void> {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 7); // Get events for the next 7 days

  try {
    const events = await getUserCalendar(accessToken, userEmail, startDate, endDate);
    console.log('Calendar events:', events);
  } catch (error) {
    console.error('Failed to fetch calendar events:', error);
  }
}