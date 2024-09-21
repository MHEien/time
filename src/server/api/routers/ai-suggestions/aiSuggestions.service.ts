import type { ProtectedTRPCContext } from "../../trpc";
import type {
  ListAiSuggestedEventsInput,
  GetAiSuggestedEventInput,
  CreateAiSuggestedEventInput,
  UpdateAiSuggestedEventInput,
  DeleteAiSuggestedEventInput,
} from "./aiSuggestions.input";
import { activities, wakatimeData, projects, githubPullRequests, calendarEvents, githubIssues, githubCommits } from '@/server/db/schema';
import { addDays, startOfWeek, format, parse, min, max } from 'date-fns';
import { aiSuggestedEvents, userSettings } from "@/server/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { toZonedTime } from 'date-fns-tz';
import type { Day } from 'date-fns';
import type { RouterOutputs } from '@/trpc/shared';
import { openai } from "../../openai";

type UserSettings = RouterOutputs['userSettings']['mySettings'];
type Activity = typeof activities.$inferSelect;
type WakatimeData = typeof wakatimeData.$inferSelect;

type Commit = RouterOutputs['github']['myCommits'][number];
type Issue = RouterOutputs['github']['myIssues'][number];
type PullRequest = RouterOutputs['github']['myPRs'][number];

type GitHubData = {
  issues: Issue[];
  prs: PullRequest[];
  commits: Commit[];
};

interface LLMEvent {
  userId: string;
  title: string;
  description: string;
  suggestedStartTime: string | Date;
  suggestedEndTime: string | Date;
  priority: number;
  relatedActivityOrProjectId: string | null;
  status: "pending" | "accepted" | "rejected";
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

  const event = await ctx.db.insert(aiSuggestedEvents).values({
    id: crypto.randomUUID().slice(0, 30),
    userId: ctx.user.id,
    title: input.title,
    description: input.description,
    suggestedStartTime: new Date(input.suggestedStartTime),
    suggestedEndTime: new Date(input.suggestedEndTime),
    priority: input.priority,
    relatedActivityId: input.relatedActivityId,
    relatedProjectId: input.relatedProjectId,
    status: "pending",
  }).returning().then(([insertedEvent]) => insertedEvent);

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
  }) ?? {
    userId: ctx.user.id,
    timeZone: 'UTC',
    workingHoursStart: '09:00',
    workingHoursEnd: '17:00',
    weekStartDay: 1,
    defaultActivityTrackingEnabled: true,
    defaultCalendarSyncEnabled: true,
  };
  console.log("User settings:", userSetting);
  const nextWeekDates = getNextWeekDates(userSetting.weekStartDay as Day);
  // Fetch recent activities (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const startDate = nextWeekDates[0];
  const endDate = nextWeekDates[1];
  let nextWeekCalendarEvents;
  if (startDate && endDate) {
   nextWeekCalendarEvents = await ctx.db.query.calendarEvents.findMany({
    where: and(
      eq(calendarEvents.userId, ctx.user.id),
      gte(calendarEvents.startTime, startDate),
      lte(calendarEvents.endTime, endDate)
    ),
    orderBy: (table, { desc }) => [desc(table.startTime)],
  })} else {
    return [];
  }
  console.log("Number of next week calendar events:", nextWeekCalendarEvents.length);
  // Fetch recent Wakatime data (last 30 days)

  const recentActivities = await fetchRecentActivities(ctx, thirtyDaysAgo);
  const recentWakatimeData = await fetchRecentWakatimeData(ctx, thirtyDaysAgo);
  const githubData = await fetchGitHubData(ctx, thirtyDaysAgo);
  // Fetch user projects
  const userProjects = await ctx.db.query.projects.findMany({
    where: eq(projects.userId, ctx.user.id),
  });
  console.log("Number of user projects:", userProjects.length);

  // Analyze patterns
  const activityPatterns = analyzeActivityPatterns(recentActivities, userSetting);
  const codingPatterns = analyzeCodingPatterns(recentWakatimeData, userSetting);
  const workPatterns = combineInsights(activityPatterns, codingPatterns);
  const githubPatterns = analyzeGithub(githubData);

  
  console.log("Number of combined work patterns:", workPatterns.length);


  const llmInput = {
    userSettings: userSetting,
    lockedEvents: nextWeekCalendarEvents.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      isAllDay: event.isAllDay,
      recurrenceRule: event.recurrenceRule,
      externalCalendarId: event.externalCalendarId,
    })),
    workPatterns: workPatterns.slice(0, 10), 
    githubPatterns: githubPatterns.slice(0, 10), 
    projects: userProjects.slice(0, 5),
    nextWeekDates: nextWeekDates.map(date => format(date, 'yyyy-MM-dd')),
    recentActivitiesSummary: summarizeRecentActivities(recentActivities),
    recentCodingSummary: summarizeRecentCoding(recentWakatimeData),
  };

  const prompt = `
  You are an AI assistant tasked with generating a recommended calendar schedule for the upcoming week based on the given input. The input data is structured as follows:
  
  <todays_date>${format(new Date(), 'yyyy-MM-dd')}</todays_date>
  <todays_day_of_week>${format(new Date(), 'EEEE')}</todays_day_of_week>
  
  <user_settings>${JSON.stringify(llmInput.userSettings, null, 2)}</user_settings>
  
  Your task is to analyze this data and generate a list of suggested events for the user's calendar for the upcoming week. The output should be in JSON format, following the structure of the \`aiSuggestedEvents\` table schema provided.
  
  Follow these steps to generate the recommended schedule:
  
  1. Process the user settings:
     - Note the user's time zone, working hours, and week start day.
     - Consider the user's preferences for activity tracking and calendar sync.
  
  2. Analyze the work patterns:
     - Identify recurring activities and their frequencies.
     - Consider the day of the week, start time, end time, and total duration for each pattern.
     - Pay special attention to patterns with higher frequencies and longer durations.
  
  3. Incorporate projects into the schedule:
     - Allocate time for project-related tasks based on their priority, recent activity, and GitHub data.
     - Ensure a balance between different projects based on their recent engagement levels.
  
  4. Use the next week dates to structure your suggested events:
     - Ensure that suggested events fall within these dates and the user's working hours.
     - Distribute tasks evenly throughout the week, considering the user's typical work patterns.
  
  5. Incorporate insights from the recent activities and coding summaries:
     - Suggest events that align with the user's recent activity and coding patterns.
     - Allocate time for frequently used applications, languages, or activities.
  
  6. Generate suggested events based on the analyzed data:
     - Create a balanced schedule that includes breaks, focused work, and project-specific tasks.
     - Ensure that events do not overlap and adhere to the user's working hours.
     - Prioritize tasks based on recent GitHub activity (e.g., open PRs, issues, recent commits).
  
  7. For each suggested event, provide the following information:
     - A descriptive title that clearly indicates the purpose of the event
     - A brief description explaining the event's context and importance
     - Suggested start and end times (in ISO 8601 format with timezone)
     - A priority level (1-5, with 1 being highest priority)
     - Related activity or project ID (if applicable)
     - Status (set to "pending" for all suggested events)
  
  8. Ensure variety and balance in the schedule:
     - Mix different types of activities (coding, meetings, planning, etc.)
     - Include buffer time between tasks for context switching
     - Suggest breaks and time for personal development
  
  Format your output as a JSON array of objects, where each object represents a suggested event and follows the structure provided earlier.

  Schema:
  {
  "title": string,
  "description": string,
  "suggestedStartTime": string,
  "suggestedEndTime": string,
  "priority": number,
  "relatedActivityId": string | null,
  "relatedProjectId": string | null,
  "status": "pending" | "accepted" | "rejected"
}
  
  Additional instructions:
  - Ensure there is at least a 15-minute break between events.
  - The maximum duration of any single event should not exceed 3 hours.
  - Avoid scheduling events outside the user's working hours.
  - The schedule should be realistic, considerate of the user's well-being, and aligned with their recent work patterns.
  
  It is essential that your response is a valid JSON array of objects, and contain no other text or code.
  `;

  console.log("LLM prompt:", prompt);

  // Send llmInput to LLM service and process the response
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: prompt,
      },
      {
        role: "user",
        content: JSON.stringify(llmInput),
      },
    ],
    temperature: 0.7,
  });

  console.log("LLM output:", completion?.choices[0]?.message?.content);

  // Sanitize the LLM output by removing possible ```json or ``` wrapping
  let rawOutput = completion?.choices[0]?.message?.content ?? "[]";
  rawOutput = rawOutput.trim().replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '');

  console.log("Sanitized output:", rawOutput);

  // Try parsing the sanitized output
// After parsing the LLM output
const output = JSON.parse(rawOutput) as LLMEvent[];

  // Insert the events into the database using bulk insert
  const eventValues = output.map((event: LLMEvent) => ({
    id: crypto.randomUUID().slice(0, 30),
    userId: ctx.user.id,
    title: event.title,
    description: event.description,
    suggestedStartTime: new Date(event.suggestedStartTime),
    suggestedEndTime: new Date(event.suggestedEndTime),
    priority: event.priority,
    status: event.status ?? "pending",
    createdAt: new Date(),
    updatedAt: null,
  }));
  console.log("Inserted events:", eventValues);
  const insertedEvents = await ctx.db.insert(aiSuggestedEvents).values(eventValues).returning();

  console.log("Inserted events:", insertedEvents);

  return insertedEvents;
};


function summarizeRecentActivities(activities: Activity[]): Record<string, number> {
  // Aggregate data to reduce size
  const activityCounts = activities.reduce((acc, activity) => {
    acc[activity.activityType] = (acc[activity.activityType] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Return top 5 activities
  const sortedActivities = Object.entries(activityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return Object.fromEntries(sortedActivities);
}

function summarizeRecentCoding(wakatimeData: WakatimeData[]): Record<string, number> {
  // Aggregate data to reduce size
  const codingCounts = wakatimeData.reduce((acc, entry) => {
    const language = typeof entry.language === 'string' ? entry.language : 'unknown';
    const duration = typeof entry.duration === 'number' ? entry.duration : 0;
    acc[language] = (acc[language] ?? 0) + duration;
    return acc;
  }, {} as Record<string, number>);

  // Return top 5 languages
  const sortedCoding = Object.entries(codingCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return Object.fromEntries(sortedCoding);
}

function analyzeGithub(githubData: GitHubData): WorkPattern[] {
  const patterns: Record<string, WorkPattern> = {};

  function processItem(item: { createdAt: string | Date, projectId?: string | null }, itemType: string) {
    try {
      const createdAt = item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt);
      if (isNaN(createdAt.getTime())) {
        console.warn(`Invalid date for ${itemType}:`, item.createdAt);
        return;
      }

      const zonedStartTime = toZonedTime(createdAt, new Date().toLocaleString('en-US', { timeZone: 'UTC' }));
      const dayOfWeek = zonedStartTime.getDay();
      const startTime = format(zonedStartTime, 'HH:mm');

      const key = `${dayOfWeek}-${startTime}-${item.projectId ?? 'noProject'}`;

      if (!patterns[key]) {
        patterns[key] = {
          dayOfWeek,
          startTime,
          endTime: startTime,
          activityType: 'coding',
          projectId: item.projectId ?? undefined,
          frequency: 1,
        };
      } else {
        patterns[key].frequency += 1;
      }
    } catch (error) {
      console.error(`Error processing ${itemType}:`, error);
    }
  }

  githubData.issues.forEach(issue => processItem(issue, 'issue'));
  githubData.prs.forEach(pr => processItem(pr, 'pull request'));
  githubData.commits.forEach(commit => processItem(commit, 'commit'));

  return Object.values(patterns).sort((a, b) => b.frequency - a.frequency);
}
function analyzeActivityPatterns(activities: Activity[], userSettings: UserSettings): WorkPattern[] {
  const patterns: Record<string, WorkPattern> = {};

  activities.forEach(activity => {
    const zonedStartTime = toZonedTime(activity.startTime, userSettings?.timeZone ?? 'UTC');
    const dayOfWeek = zonedStartTime.getDay();
    const startTime = format(zonedStartTime, 'HH:mm');
    const endTime = activity.endTime ? format(toZonedTime(activity.endTime, userSettings?.timeZone ?? 'UTC'), 'HH:mm') : startTime;

    const normalizedStartTime = normalizeTime(startTime);
    const normalizedEndTime = normalizeTime(endTime);

    const key = `${dayOfWeek}-${normalizedStartTime}-${activity.activityType}-${activity.projectId ?? 'noProject'}`;

    if (!patterns[key]) {
      patterns[key] = {
        dayOfWeek,
        startTime: normalizedStartTime,
        endTime: normalizedEndTime,
        activityType: activity.activityType,
        projectId: activity.projectId ?? undefined,
        frequency: 1
      };
    } else {
      patterns[key].frequency += 1;
      if (normalizedEndTime > patterns[key].endTime) {
        patterns[key].endTime = normalizedEndTime;
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

    // Normalize times to 15-minute intervals
    const normalizedTime = normalizeTime(time);

    const key = `${dayOfWeek}-${normalizedTime}-${data.projectId ?? 'noProject'}`;

    if (!patterns[key]) {
      patterns[key] = {
        dayOfWeek,
        startTime: normalizedTime,
        endTime: normalizedTime, // We'll adjust this later
        activityType: 'coding',
        projectId: data.projectId ?? undefined,
        frequency: 1,
      };
    } else {
      patterns[key].frequency += 1;
      patterns[key].endTime = normalizedTime;
    }
  });

  return Object.values(patterns).sort((a, b) => b.frequency - a.frequency);
}

function normalizeTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (!minutes) return '00:00';
  const normalizedMinutes = Math.floor(minutes / 15) * 15;
  return `${String(hours).padStart(2, '0')}:${String(normalizedMinutes).padStart(2, '0')}`;
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
          parse(pattern.startTime, 'HH:mm', new Date()),
        ]),
        'HH:mm'
      );
      existingPattern.endTime = format(
        max([
          parse(existingPattern.endTime, 'HH:mm', new Date()),
          parse(pattern.endTime, 'HH:mm', new Date()),
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


async function fetchRecentActivities(ctx: ProtectedTRPCContext, since: Date) {
  return ctx.db.query.activities.findMany({
    where: and(
      eq(activities.userId, ctx.user.id),
      gte(activities.startTime, since)
    ),
    orderBy: (table, { desc }) => [desc(table.startTime)],
    with: {
      project: true,
    },
  });
}

async function fetchRecentWakatimeData(ctx: ProtectedTRPCContext, since: Date) {
  return ctx.db.query.wakatimeData.findMany({
    where: and(
      eq(wakatimeData.userId, ctx.user.id),
      gte(wakatimeData.recordedAt, since)
    ),
    orderBy: (table, { desc }) => [desc(table.recordedAt)],
    with: {
      project: true,
    },
  });
}

async function fetchGitHubData(ctx: ProtectedTRPCContext, since: Date) {
  const [issues, prs, commits] = await Promise.all([
    ctx.db.query.githubIssues.findMany({
      where: and(
        eq(githubIssues.userId, ctx.user.id),
        gte(githubIssues.createdAt, since)
      ),
      orderBy: (table, { desc }) => [desc(table.createdAt)],
      with: {
        project: true,
      },
    }),
    ctx.db.query.githubPullRequests.findMany({
      where: and(
        eq(githubPullRequests.userId, ctx.user.id),
        gte(githubPullRequests.createdAt, since)
      ),
      orderBy: (table, { desc }) => [desc(table.createdAt)],
      with: {
        project: true,
      },
    }),
    ctx.db.query.githubCommits.findMany({
      where: and(
        eq(githubCommits.userId, ctx.user.id),
        gte(githubCommits.createdAt, since)
      ),
      orderBy: (table, { desc }) => [desc(table.createdAt)],
      with: {
        project: true,
      },
    }),
  ]);

  return { issues, prs, commits };
}
