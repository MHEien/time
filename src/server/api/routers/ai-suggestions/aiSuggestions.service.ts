import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import type { ProtectedTRPCContext } from "../../trpc";
import { 
  activities, 
  wakatimeData, 
  calendarEvents,
  aiSuggestedEvents, 
  userSettings,
  githubCommits,
  githubIssues,
  githubPullRequests
} from '@/server/db/schema';
import { addDays, startOfWeek, format } from 'date-fns';
import { and, eq, gte, lte } from "drizzle-orm";
import type { Day } from 'date-fns';
import { openai } from "../../openai";
import type { CreateAiSuggestedEventInput, DeleteAiSuggestedEventInput, GetAiSuggestedEventInput, ListAiSuggestedEventsInput, UpdateAiSuggestedEventInput } from "./aiSuggestions.input";
import { env } from "@/env";
import superjson from 'superjson';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import * as sanitizeHtml from 'sanitize-html';

const parse = superjson.parse;
const stringify = superjson.stringify;

interface LLMEvent {
  userId: string;
  title: string;
  description: string;
  suggestedStartTime: string | Date;
  suggestedEndTime: string | Date;
  priority: number;
  relatedActivityOrProjectId: string | null;
  status: "pending" | "accepted" | "rejected";
  steps?: string[];
  background?: string;
  challenges?: string[];
}

const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small",
});

const pinecone = new PineconeClient({
  apiKey: env.PINECONE_API_KEY,
});
// Will automatically read the PINECONE_API_KEY and PINECONE_ENVIRONMENT env vars
const pineconeIndex = pinecone.Index(env.PINECONE_INDEX);

const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
  pineconeIndex,
  // Maximum number of batch requests to allow at once. Each batch is 1000 vectors.
  maxConcurrency: 5,
  // You can pass a namespace here too
  // namespace: "foo",
});




// Data fetching module
async function fetchAndEmbedData(ctx: ProtectedTRPCContext, since: Date) {
  console.log(`[fetchAndEmbedData] Starting data fetch and embedding process for user ${ctx.user.id} since ${since.toISOString()}`);
  
  try {
    const [activities, wakatimeData, githubData] = await Promise.all([
      fetchRecentActivities(ctx, since),
      fetchRecentWakatimeData(ctx, since),
      fetchGitHubData(ctx, since),
    ]);

    const today = new Date();
    const nextWeekStart = startOfWeek(addDays(today, 7), { weekStartsOn: 1 });
    const fridayNextWeek = addDays(nextWeekStart, 4);

    const externalCalendarEvents = await ctx.db.query.calendarEvents.findMany({
      where: and(
        eq(calendarEvents.userId, ctx.user.id),
        gte(calendarEvents.startTime, nextWeekStart),
        lte(calendarEvents.endTime, fridayNextWeek)
      ),
      orderBy: (table, { desc }) => [desc(table.startTime)],
    });

    console.log(`[fetchAndEmbedData] Fetched ${activities.length} activities, ${wakatimeData.length} Wakatime entries, ${externalCalendarEvents.length} external calendar events, and GitHub data`);

    const allData = [
      ...activities.map(a => ({ ...a, type: 'activity' })),
      ...externalCalendarEvents.map(e => ({ ...e, type: 'calendar' })),
      ...wakatimeData.map(w => ({ ...w, type: 'wakatime' })),
      ...githubData.issues.map(i => ({ ...i, type: 'issue' })),
      ...githubData.prs.map(p => ({ ...p, type: 'pr' })),
      ...githubData.commits.map(c => ({ ...c, type: 'commit' })),
    ];

    console.log(`[fetchAndEmbedData] Embedding ${allData.length} items into vector store`);

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    for (const item of allData) {
      try {
        const sanitizedContent = sanitizeHtml(stringify(item), {
          allowedTags: [],
          allowedAttributes: {},
        });

        const chunks = await textSplitter.createDocuments([sanitizedContent]);

        for (const chunk of chunks) {
          const vectorId = await vectorStore.addDocuments([{
            pageContent: chunk.pageContent,
            metadata: { 
              type: item.type, 
              id: item.id,
              chunkIndex: chunks.indexOf(chunk),
              totalChunks: chunks.length,
            },
          }]);
          console.log(`[fetchAndEmbedData] Embedded ${item.type} chunk ${chunks.indexOf(chunk) + 1}/${chunks.length} with id ${item.id} into vector store with id ${vectorId[0]}`);
        }
      } catch (error) {
        console.error(`[fetchAndEmbedData] Error embedding ${item.type} with id ${item.id}:`, error);
      }
    }

    console.log(`[fetchAndEmbedData] Embedding process completed`);
  } catch (error) {
    console.error(`[fetchAndEmbedData] Error in fetch and embed process:`, error);
  }
}
// Scheduling module
async function generateInitialSchedule(ctx: ProtectedTRPCContext, nextWeekDates: Date[]): Promise<LLMEvent[]> {
  console.log(`[generateInitialSchedule] Generating initial schedule for user ${ctx.user.id}`);
  const userSetting = await fetchUserSettings(ctx);
  const workPatterns = await analyzeWorkPatterns(ctx);

  const startDate = nextWeekDates[0];
  const endDate = nextWeekDates[6];

  const nextWeekCalendarEvents = await ctx.db.query.calendarEvents.findMany({
    where: and(
      eq(calendarEvents.userId, ctx.user.id),
      gte(calendarEvents.startTime, startDate!),
      lte(calendarEvents.endTime, endDate!)
    ),
    orderBy: (table, { desc }) => [desc(table.startTime)],
  });

  console.log(`[generateInitialSchedule] Fetched ${nextWeekCalendarEvents.length} calendar events for next week`);

  const prompt = `
    You are an AI assistant tasked with generating an initial schedule for the upcoming week.
    User settings: ${stringify(userSetting)}
    Work patterns: ${stringify(workPatterns)}
    Next week's external calendar events: ${stringify(nextWeekCalendarEvents)}
    Next week dates: ${stringify(nextWeekDates.map(d => format(d, 'yyyy-MM-dd')))}

    Generate a rough schedule with time-blocks and task titles. 
    The output should be a JSON array of objects with the following structure:
    {
      "title": string,
      "suggestedStartTime": string (ISO 8601 format),
      "suggestedEndTime": string (ISO 8601 format),
      "priority": number (1-5)
    }
  `;

  console.log(`[generateInitialSchedule] Sending prompt to OpenAI for initial schedule generation`);
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "system", content: prompt }],
    temperature: 0.7,
  });

  const initialSchedule = parse(completion.choices[0]?.message?.content ?? "[]");
  const schedule = initialSchedule as LLMEvent[];
  console.log(`[generateInitialSchedule] Generated ${schedule.length} initial schedule items`);
  return schedule
}

// Task detailing module
async function generateTaskDetails(ctx: ProtectedTRPCContext, task: Partial<LLMEvent>): Promise<Partial<LLMEvent>> {
  console.log(`[generateTaskDetails] Generating details for task: ${task.title}`);
  const relevantData = await vectorStore.similaritySearch(task.title!, 5);
  console.log(`[generateTaskDetails] Found ${relevantData.length} relevant data points`);

  const prompt = `
    You are an AI assistant tasked with providing detailed information for a scheduled task.
    Task: ${stringify(task)}
    Relevant data: ${stringify(relevantData)}

    Please provide:
    1. A detailed description of the task
    2. Steps to complete the task
    3. Any relevant background information or context
    4. Potential challenges or dependencies

    The output should be a JSON object with the following structure:
    {
      "description": string,
      "steps": string[],
      "background": string,
      "challenges": string[]
    }
  `;

  console.log(`[generateTaskDetails] Sending prompt to OpenAI for task details generation`);
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "system", content: prompt }],
    temperature: 0.7,
  });

  const taskDetails = parse(completion.choices[0]?.message?.content ?? "{}")
  console.log(`[generateTaskDetails] Generated details for task: ${task.title}`);
  return taskDetails as Partial<LLMEvent>;
}

// Refinement module
async function refineSchedule(ctx: ProtectedTRPCContext, schedule: LLMEvent[]): Promise<LLMEvent[]> {
  console.log(`[refineSchedule] Refining schedule with ${schedule.length} items`);
  const prompt = `
    You are an AI assistant tasked with refining a weekly schedule.
    Current schedule: ${stringify(schedule)}

    Please review the schedule and make any necessary adjustments based on:
    1. Task dependencies
    2. Potential conflicts
    3. Optimal task ordering

    The output should be a JSON array with the same structure as the input, but with any necessary modifications.
  `;

  console.log(`[refineSchedule] Sending prompt to OpenAI for schedule refinement`);
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "system", content: prompt }],
    temperature: 0.7,
  });
  
  const refinedSchedule = parse(completion.choices[0]?.message?.content ?? "[]");
  const insertedSchedule = refinedSchedule as LLMEvent[];
  console.log(`[refineSchedule] Refined schedule now has ${insertedSchedule.length} items`);
  return insertedSchedule;
}

// Main function
export const generateNextWeekEvents = async (ctx: ProtectedTRPCContext) => {
  console.log(`[generateNextWeekEvents] Starting next week event generation for user ${ctx.user.id}`);
  const nextWeekDates = getNextWeekDates(1); // Assuming week starts on Monday (1)
  
  // Fetch and embed data
  await fetchAndEmbedData(ctx, addDays(new Date(), -30)); // Fetch last 30 days of data

  // Generate initial schedule
  const initialSchedule = await generateInitialSchedule(ctx, nextWeekDates);

  // Generate task details
  console.log(`[generateNextWeekEvents] Generating detailed schedule`);
  const detailedSchedule = await Promise.all(
    initialSchedule.map(async (task) => ({
      ...task,
      ...(await generateTaskDetails(ctx, task)),
    }))
  );

  // Refine schedule
  const refinedSchedule = await refineSchedule(ctx, detailedSchedule);

  // Insert events into the database
  console.log(`[generateNextWeekEvents] Inserting ${refinedSchedule.length} events into the database`);
  const eventValues = refinedSchedule.map((event) => ({
    id: crypto.randomUUID().slice(0, 30),
    userId: ctx.user.id,
    title: event.title,
    description: event.description,
    suggestedStartTime: new Date(event.suggestedStartTime),
    suggestedEndTime: new Date(event.suggestedEndTime),
    priority: event.priority,
    status: event.status as "pending" | "accepted" | "rejected",
    steps: stringify(event.steps ?? []),
    background: event.background ?? null,
    challenges: stringify(event.challenges ?? []),
    createdAt: new Date(),
    updatedAt: null,
  }));

  const insertedEvents = await ctx.db.insert(aiSuggestedEvents).values(eventValues).returning();
  console.log(`[generateNextWeekEvents] Inserted ${insertedEvents.length} events into the database`);

  return insertedEvents;
};

// Helper functions
async function fetchUserSettings(ctx: ProtectedTRPCContext) {
  console.log(`[fetchUserSettings] Fetching user settings for user ${ctx.user.id}`);
  return ctx.db.query.userSettings.findFirst({
    where: eq(userSettings.userId, ctx.user.id),
  });
}

async function analyzeWorkPatterns(ctx: ProtectedTRPCContext) {
  console.log(`[analyzeWorkPatterns] Analyzing work patterns for user ${ctx.user.id}`);
  const thirtyDaysAgo = addDays(new Date(), -30);
  const activities = await fetchRecentActivities(ctx, thirtyDaysAgo);
  const wakatimeData = await fetchRecentWakatimeData(ctx, thirtyDaysAgo);

  // Implement your work pattern analysis logic here
  // This is a placeholder implementation
  const patterns = activities.map(activity => ({
    dayOfWeek: new Date(activity.startTime).getDay(),
    startTime: format(new Date(activity.startTime), 'HH:mm'),
    endTime: format(new Date(activity.endTime ?? activity.startTime), 'HH:mm'),
    activityType: activity.activityType,
    frequency: 1, // You might want to calculate this based on recurring patterns
  }));
  console.log(`[analyzeWorkPatterns] Analyzed ${patterns.length} work patterns`);
  return patterns;
}

function getNextWeekDates(weekStartDay: Day): Date[] {
  const today = new Date();
  const nextWeekStart = startOfWeek(addDays(today, 7), { weekStartsOn: weekStartDay });
  return Array.from({ length: 7 }, (_, i) => addDays(nextWeekStart, i));
}

async function fetchRecentActivities(ctx: ProtectedTRPCContext, since: Date) {
  console.log(`[fetchRecentActivities] Fetching activities for user ${ctx.user.id} since ${since.toISOString()}`);
  const recentActivities = await ctx.db.query.activities.findMany({
    where: and(
      eq(activities.userId, ctx.user.id),
      gte(activities.startTime, since)
    ),
    orderBy: (table, { desc }) => [desc(table.startTime)],
  });
  console.log(`[fetchRecentActivities] Fetched ${recentActivities.length} activities`);
  return recentActivities;
}

async function fetchRecentWakatimeData(ctx: ProtectedTRPCContext, since: Date) {
  console.log(`[fetchRecentWakatimeData] Fetching Wakatime data for user ${ctx.user.id} since ${since.toISOString()}`);
  const recentWakatimeData = await ctx.db.query.wakatimeData.findMany({
    where: and(
      eq(wakatimeData.userId, ctx.user.id),
      gte(wakatimeData.recordedAt, since)
    ),
    orderBy: (table, { desc }) => [desc(table.recordedAt)],
  });
  console.log(`[fetchRecentWakatimeData] Fetched ${recentWakatimeData.length} Wakatime entries`);
  return recentWakatimeData;
}

async function fetchGitHubData(ctx: ProtectedTRPCContext, since: Date) {
  console.log(`[fetchGitHubData] Fetching GitHub data for user ${ctx.user.id} since ${since.toISOString()}`);
  const [issues, prs, commits] = await Promise.all([
    ctx.db.query.githubIssues.findMany({
      where: and(
        eq(githubIssues.userId, ctx.user.id),
        gte(githubIssues.createdAt, since)
      ),
      orderBy: (table, { desc }) => [desc(table.createdAt)],
    }),
    ctx.db.query.githubPullRequests.findMany({
      where: and(
        eq(githubPullRequests.userId, ctx.user.id),
        gte(githubPullRequests.createdAt, since)
      ),
      orderBy: (table, { desc }) => [desc(table.createdAt)],
    }),
    ctx.db.query.githubCommits.findMany({
      where: and(
        eq(githubCommits.userId, ctx.user.id),
        gte(githubCommits.createdAt, since)
      ),
      orderBy: (table, { desc }) => [desc(table.createdAt)],
    }),
  ]);

  console.log(`[fetchGitHubData] Fetched ${issues.length} issues, ${prs.length} PRs, and ${commits.length} commits`);
  return { issues, prs, commits };
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