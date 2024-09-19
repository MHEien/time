import { generateId } from "lucia";
import type { ProtectedTRPCContext } from "../../trpc";
import type {
  ListAiSuggestedEventsInput,
  GetAiSuggestedEventInput,
  CreateAiSuggestedEventInput,
  UpdateAiSuggestedEventInput,
  DeleteAiSuggestedEventInput,
} from "./aiSuggestions.input";
import { activities, wakatimeData, projects } from '@/server/db/schema';
import { addDays, startOfWeek, format, parse, min, max } from 'date-fns';
import { aiSuggestedEvents, userSettings } from "@/server/db/schema";
import { and, eq, gte } from "drizzle-orm";
import { toZonedTime } from 'date-fns-tz';
import type { Day } from 'date-fns';
import type { RouterOutputs } from '@/trpc/shared';
import { openai } from "../../openai";

type UserSettings = RouterOutputs['userSettings']['mySettings'];
type Activity = typeof activities.$inferSelect;
type WakatimeData = typeof wakatimeData.$inferSelect;

interface LLMEvent {
  id: string;
  userId: string;
  title: string;
  description: string;
  suggestedStartTime: string;
  suggestedEndTime: string;
  priority: number;
  relatedActivityId: string | null;
  relatedProjectId: string | null;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  updatedAt: string | null;
}

interface WorkPattern {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  activityType: string;
  projectId?: string;
  frequency: number;
}



export const listAiSuggestedEvents = async (ctx: ProtectedTRPCContext, input: ListAiSuggestedEventsInput) => {
  return ctx.db.query.aiSuggestedEvents.findMany({
    where: (table, { and, eq }) => {
      const conditions = [eq(table.userId, ctx.user.id)];
      if (input.status) {
        conditions.push(eq(table.status, input.status));
      }
      return and(...conditions);
    },
    limit: input.perPage,
    offset: (input.page - 1) * input.perPage,
    orderBy: (table, { asc }) => [asc(table.suggestedStartTime)],
    columns: {
      id: true,
      title: true,
      suggestedStartTime: true,
      suggestedEndTime: true,
      priority: true,
      status: true,
    },
  });
};

export const getAiSuggestedEvent = async (ctx: ProtectedTRPCContext, input: GetAiSuggestedEventInput) => {
  return ctx.db.query.aiSuggestedEvents.findFirst({
    where: (table, { and, eq }) => and(eq(table.id, input.id), eq(table.userId, ctx.user.id)),
  });
};

export const createAiSuggestedEvent = async (ctx: ProtectedTRPCContext, input: CreateAiSuggestedEventInput) => {
  const id = generateId(15);

  const [event] = await ctx.db.insert(aiSuggestedEvents).values({
    id,
    userId: ctx.user.id,
    title: input.title,
    description: input.description,
    suggestedStartTime: new Date(input.suggestedStartTime),
    suggestedEndTime: new Date(input.suggestedEndTime),
    priority: input.priority,
    relatedActivityId: input.relatedActivityId,
    relatedProjectId: input.relatedProjectId,
    status: "pending",
  }).returning();

  return event;
};

export const updateAiSuggestedEvent = async (ctx: ProtectedTRPCContext, input: UpdateAiSuggestedEventInput) => {
  const [event] = await ctx.db
    .update(aiSuggestedEvents)
    .set({
      status: input.status,
    })
    .where(and(eq(aiSuggestedEvents.id, input.id), eq(aiSuggestedEvents.userId, ctx.user.id)))
    .returning();

  return event;
};

export const deleteAiSuggestedEvent = async (ctx: ProtectedTRPCContext, input: DeleteAiSuggestedEventInput) => {
  const [event] = await ctx.db
    .delete(aiSuggestedEvents)
    .where(and(eq(aiSuggestedEvents.id, input.id), eq(aiSuggestedEvents.userId, ctx.user.id)))
    .returning();

  return event;
};

export const myEvents = async (ctx: ProtectedTRPCContext) => {
  const events = await ctx.db.query.aiSuggestedEvents.findMany({
    where: eq(aiSuggestedEvents.userId, ctx.user.id),
    orderBy: (table, { desc }) => [desc(table.suggestedStartTime)],
  });

  return events;
};

export const generateNextWeekEvents = async (ctx: ProtectedTRPCContext) => {
  console.log("Starting data preparation for LLM-based event generation");

  // Fetch user settings
  const userSetting = await ctx.db.query.userSettings.findFirst({
    where: eq(userSettings.userId, ctx.user.id),
  })?? {
    userId: ctx.user.id,
    timeZone: 'UTC',
    workingHoursStart: '09:00',
    workingHoursEnd: '17:00',
    weekStartDay: 1,
    defaultActivityTrackingEnabled: true,
    defaultCalendarSyncEnabled: true,
  };
  console.log("User settings:", userSetting);

  // Fetch recent activities (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentActivities = await ctx.db.query.activities.findMany({
    where: and(
      eq(activities.userId, ctx.user.id),
      gte(activities.startTime, thirtyDaysAgo)
    ),
    orderBy: (table, { desc }) => [desc(table.startTime)],
  });
  console.log("Number of recent activities:", recentActivities.length);

  // Fetch recent Wakatime data (last 30 days)
  const recentWakatimeData = await ctx.db.query.wakatimeData.findMany({
    where: and(
      eq(wakatimeData.userId, ctx.user.id),
      gte(wakatimeData.recordedAt, thirtyDaysAgo)
    ),
    orderBy: (table, { desc }) => [desc(table.recordedAt)],
  });
  console.log("Number of recent Wakatime entries:", recentWakatimeData.length);

  // Fetch user projects
  const userProjects = await ctx.db.query.projects.findMany({
    where: eq(projects.userId, ctx.user.id),
  });
  console.log("Number of user projects:", userProjects.length);

  // Analyze patterns
  const activityPatterns = analyzeActivityPatterns(recentActivities, userSetting);
  const codingPatterns = analyzeCodingPatterns(recentWakatimeData, userSetting);
  const workPatterns = combineInsights(activityPatterns, codingPatterns);
  console.log("Number of combined work patterns:", workPatterns.length);

  // Get next week's dates
  const nextWeekDates = getNextWeekDates(userSetting.weekStartDay as Day);

  // Prepare data for LLM
  const llmInput = {
    userSettings: userSetting,
    workPatterns,
    projects: userProjects,
    nextWeekDates,
    recentActivitiesSummary: summarizeRecentActivities(recentActivities),
    recentCodingSummary: summarizeRecentCoding(recentWakatimeData),
};


  const prompt = `
          You are an AI assistant tasked with generating a recommended calendar schedule for the upcoming week based on the given input. The input data is structured as follows:

          <todays_date> ${format(new Date(), 'yyyy-MM-dd')} </todays_date>
          <todays_day_of_week> ${format(new Date(), 'EEEE')} </todays_day_of_week>
  
          <user_settings> ${JSON.stringify(llmInput.userSettings, null, 2)} </user_settings>
  
          Your task is to analyze this data and generate a list of suggested events for the user's calendar for the upcoming week. The output should be in JSON format, following the structure of the \`aiSuggestedEvents\` table schema provided.
  
          Follow these steps to generate the recommended schedule:
  
          1. Process the user settings:
             - Note the user's time zone, working hours, and week start day.
             - Consider the user's preferences for activity tracking and calendar sync.
  
          2. Analyze the work patterns:
             - Identify recurring activities and their frequencies.
             - Consider the day of the week, start time, and end time for each pattern.
  
          3. If there are any projects listed, incorporate them into the schedule:
             - Allocate time for project-related tasks based on their priority and deadlines.
  
          4. Use the next week dates to structure your suggested events:
             - Ensure that suggested events fall within these dates.
             - Respect the user's working hours when scheduling events.
  
          5. Incorporate insights from the recent activities summary:
             - Suggest events that align with the user's recent activity patterns.
             - Allocate time for frequently used applications or activities.
  
          6. If the recent coding summary contains data, use it to suggest coding-related events:
             - Schedule coding sessions based on the user's recent coding activity.
  
          7. Generate suggested events based on the analyzed data:
             - Create a mix of work-related, project-related, and personal productivity events.
             - Ensure a balanced schedule that includes breaks and time for focused work.
  
          8. For each suggested event, provide the following information:
             - A unique ID (you can use a placeholder like "GENERATED_ID_1" for this exercise)
             - The user ID from the input data
             - A descriptive title
             - A brief description of the event's purpose
             - Suggested start and end times (in ISO 8601 format with timezone)
             - A priority level (1-5, with 1 being highest priority)
             - Related activity or project ID (if applicable)
             - Status (set to "pending" for all suggested events)
  
          9. Format your output as a JSON array of objects, where each object represents a suggested event and follows the structure of the \`aiSuggestedEvents\` table schema.
  
          Here's an example of how a single suggested event should be formatted in your output:
  
          {
            "id": "GENERATED_ID_1",
            "userId": "tq9sforzmm5jkc1nguii5",
            "title": "Focus Work Session",
            "description": "Dedicated time for uninterrupted work on high-priority tasks",
            "suggestedStartTime": "2024-09-23T10:00:00-04:00",
            "suggestedEndTime": "2024-09-23T12:00:00-04:00",
            "priority": 2,
            "relatedActivityId": null,
            "relatedProjectId": null,
            "status": "pending",
            "createdAt": "2023-05-15T12:00:00Z",
            "updatedAt": null
          }
  
          Provide your complete list of suggested events as a JSON array, ensuring that all required fields are included for each event. The "createdAt" field should be set to the current date and time, and the "updatedAt" field should be null for new suggestions.
          It is essential that your response is a a valid JSON array of objects, and contain no other text or code.
        `

        console.log("LLM prompt:", prompt);

  // TODO: Send llmInput to LLM service and process the response
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: prompt,
      }
    ]
  });
  
  console.log("LLM output:", completion?.choices[0]?.message?.content);
  
  // Sanitize the LLM output by removing possible ```json or ``` wrapping
  let rawOutput = completion?.choices[0]?.message?.content ?? "[]";
  rawOutput = rawOutput.trim().replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '');
  
  console.log("Sanitized output:", rawOutput);
  
  // Try parsing the sanitized output
  let output;
  try {
    output = JSON.parse(rawOutput) as LLMEvent[];
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error("Failed to parse LLM output as JSON: " + error.message);
    } else {
      throw new Error("An unknown error occurred during JSON parsing");
    }
  }
  
  // Validate the parsed output
  if (!output || !Array.isArray(output)) {
    throw new Error("LLM output is empty or invalid");
  }
  
  // Insert the events into the database
  const insertedEvents = await Promise.all(
    output.map(async (event: LLMEvent) => {
      return ctx.db.insert(aiSuggestedEvents).values({
        id: event.id,
        userId: ctx.user.id,
        title: event.title,
        description: event.description,
        suggestedStartTime: new Date(event.suggestedStartTime),
        suggestedEndTime: new Date(event.suggestedEndTime),
        priority: event.priority,
        relatedActivityId: event.relatedActivityId,
        relatedProjectId: event.relatedProjectId,
        status: event.status ?? "pending",
        createdAt: new Date(),
        updatedAt: null,
      });
    })
  );
  
  console.log("Inserted events:", insertedEvents);
  
  return insertedEvents;
}  

function summarizeRecentActivities(activities: Activity[]): Record<string, number> {
  return activities.reduce((acc, activity) => {
    acc[activity.activityType] = (acc[activity.activityType] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function summarizeRecentCoding(wakatimeData: WakatimeData[]): Record<string, number> {
  return wakatimeData.reduce((acc, entry) => {
    // Ensure language is a string
    const language = typeof entry.language === 'string' ? entry.language : 'unknown';

    // Ensure duration is a number
    const duration = typeof entry.duration === 'number' ? entry.duration : 0;

    // Safely add the duration to the accumulator
    acc[language] = (acc[language] ?? 0) + duration;

    return acc;
  }, {} as Record<string, number>);
}



function analyzeActivityPatterns(activities: Activity[], userSettings: UserSettings): WorkPattern[] {
  console.log("activities", activities);
    const patterns: Record<string, WorkPattern> = {};
  
    activities.forEach(activity => {
        const zonedStartTime = toZonedTime(activity.startTime, userSettings?.timeZone ?? 'UTC');
      const dayOfWeek = zonedStartTime.getDay();
      const startTime = format(zonedStartTime, 'HH:mm');
      const endTime = activity.endTime ? format(toZonedTime(activity.endTime, userSettings?.timeZone ?? 'UTC'), 'HH:mm') : startTime;

  
      const key = `${dayOfWeek}-${startTime}-${activity.activityType}-${activity.projectId ?? 'noProject'}`;
  
      if (!patterns[key]) {
        patterns[key] = {
          dayOfWeek,
          startTime,
          endTime,
          activityType: activity.activityType,
          projectId: activity.projectId ?? undefined,
          frequency: 1,
        };
      } else {
        patterns[key].frequency += 1;
        // Update end time if this activity ended later
        if (endTime > patterns[key].endTime) {
          patterns[key].endTime = endTime;
        }
      }
    });
  
    return Object.values(patterns).sort((a, b) => b.frequency - a.frequency);
  }
  
  function analyzeCodingPatterns(wakatimeData: WakatimeData[], userSettings: UserSettings): WorkPattern[] {
    const patterns: Record<string, WorkPattern> = {};
  
    wakatimeData.forEach(data => {
        const zonedTime = toZonedTime(data.recordedAt, userSettings?.timeZone ?? 'UTC');
      const dayOfWeek = zonedTime.getDay();
      const time = format(zonedTime, 'HH:mm');
  
      const key = `${dayOfWeek}-${time}-${data.projectId ?? 'noProject'}`;
  
      if (!patterns[key]) {
        patterns[key] = {
          dayOfWeek,
          startTime: time,
          endTime: time, // We'll adjust this later
          activityType: 'coding',
          projectId: data.projectId ?? undefined,
          frequency: 1,
        };
      } else {
        patterns[key].frequency += 1;
    
        patterns[key].endTime = format(addDays(parse(time, 'HH:mm', new Date()), 1), 'HH:mm');
      }
    });
  
    return Object.values(patterns).sort((a, b) => b.frequency - a.frequency);
  }
  
  function getNextWeekDates(weekStartDay: Day): Date[] {
    const today = new Date();
    const nextWeekStart = startOfWeek(addDays(today, 7), { weekStartsOn: weekStartDay });
    return Array.from({ length: 7 }, (_, i) => addDays(nextWeekStart, i));
  }
  


  function combineInsights(activityPatterns: WorkPattern[], codingPatterns: WorkPattern[]): WorkPattern[] {
    const combinedPatterns = [...activityPatterns, ...codingPatterns];
    

    const mergedPatterns = combinedPatterns.reduce((acc, pattern) => {
      const existingPattern = acc.find(p => 
        p.dayOfWeek === pattern.dayOfWeek &&
        p.startTime <= pattern.endTime &&
        p.endTime >= pattern.startTime
      );
  
      if (existingPattern) {
        existingPattern.startTime = format(
          min([
            parse(existingPattern.startTime, 'HH:mm', new Date()),
            parse(pattern.startTime, 'HH:mm', new Date())
          ]),
          'HH:mm'
        );
        existingPattern.endTime = format(
          max([
            parse(existingPattern.endTime, 'HH:mm', new Date()),
            parse(pattern.endTime, 'HH:mm', new Date())
          ]),
          'HH:mm'
        );
        existingPattern.frequency += pattern.frequency;
      } else {
        acc.push(pattern);
      }
  
      return acc;
    }, [] as WorkPattern[]);
  
    return mergedPatterns.sort((a, b) => b.frequency - a.frequency);
  }
  