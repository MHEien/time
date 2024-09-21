export interface OutlookCalendarResponse {
    "@odata.context": string;
    value: OutlookCalendarEvent[];
    "@odata.nextLink": string;
  }
  
 export interface OutlookCalendarEvent {
    "@odata.etag": string;
    id: string;
    subject: string;
    bodyPreview: string;
    body: {
      contentType: string;
      content: string;
    };
    start: {
      dateTime: string;
      timeZone: string;
    };
    end: {
      dateTime: string;
      timeZone: string;
    };
    location: {
      displayName: string;
      locationType: string;
      uniqueId?: string;
      uniqueIdType: string;
      address: Record<string, unknown>;
      coordinates: Record<string, unknown>;
    };
    attendees: Attendee[];
    organizer: {
      emailAddress: {
        name: string;
        address: string;
      };
    };
  }
  
  interface Attendee {
    type: string;
    status: {
      response: string;
      time: string;
    };
    emailAddress: {
      name: string;
      address: string;
    };
  }