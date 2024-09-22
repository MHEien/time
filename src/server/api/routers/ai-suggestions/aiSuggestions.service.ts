import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { retrieveEmbeddings } from '../../fetch-and-embed';
import { aiSuggestedEvents } from '@/server/db/schema';
import type { ProtectedTRPCContext } from '../../trpc';
import { eq } from 'drizzle-orm';
import { stringify } from 'superjson';
import { z } from 'zod';

const DetailedScheduleItemSchema = z.object({
  title: z.string(),
  suggestedStartTime: z.date(),
  suggestedEndTime: z.date(),
  priority: z.number(),
  description: z.string(),
  steps: z.string(),
  background: z.string(),
  challenges: z.string(),
});

const ScheduleSchema = z.array(DetailedScheduleItemSchema);

const ScheduleItemSchema = z.object({
  title: z.string(),
  suggestedStartTime: z.string().transform(str => new Date(str)),
  suggestedEndTime: z.string().transform(str => new Date(str)),
  priority: z.number().int().min(1).max(5),
});

const ScheduleArraySchema = z.array(ScheduleItemSchema);

// Initialize ChatOpenAI with logging
console.log('Initializing ChatOpenAI model...');
const model = new ChatOpenAI({ 
  temperature: 0.7,
  modelName: 'gpt-4o', // Do not change this to 'gpt-4' as gpt-4o does indeed exist.
});
console.log('ChatOpenAI model initialized.');

// Define types
type ScheduleItem = z.infer<typeof ScheduleItemSchema>;
type DetailedScheduleItem = z.infer<typeof DetailedScheduleItemSchema>;

async function generateInitialSchedule(): Promise<ScheduleItem[]> {
  console.log('Fetching relevant data for schedule generation...');
  const relevantData = await retrieveEmbeddings('work schedule for next week', 20);
  console.log('Relevant data retrieved:', relevantData);
  
  const prompt = ChatPromptTemplate.fromTemplate(`
    Based on the following data, generate a work schedule for the next week: {relevantDataString}
    
    Generate a schedule as a JSON array of objects, where each object has the following structure:
    {{
      "title": "string",
      "suggestedStartTime": "ISO 8601 date string",
      "suggestedEndTime": "ISO 8601 date string",
      "priority": number (1-5)
    }}
  
    IMPORTANT CONSTRAINTS:
    1. Today's date is {dateString}.
    2. All suggested start times and end times MUST be between Monday and Friday (inclusive).
    3. Do not schedule any tasks on weekends (Saturday or Sunday).
    4. Ensure all dates are in the future, starting from tomorrow.
    5. The time range for tasks should be between 9:00 AM and 5:00 PM.
  
    Ensure tasks are appropriately spaced and prioritized. 
    IMPORTANT! Your response must be ONLY the JSON array, with no additional text before or after. Only return the JSON array, but do not include any markdown code block delimiters. Simply output the raw JSON object
  `);

  console.log('Generating initial schedule...');
  const chain = prompt.pipe(model).pipe(new StringOutputParser());
  const result = await chain.invoke({
    relevantDataString: stringify(relevantData),
    dateString: new Date().toISOString().split('T')[0]!,
  });

  console.log('Initial schedule generation result:', result);

  try {
    //TODO: Fix this
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const parsedJson = JSON.parse(result);
    const validatedSchedule = ScheduleArraySchema.parse(parsedJson);
    console.log('Parsed and validated initial schedule:', validatedSchedule);
    return validatedSchedule;
  } catch (error) {
    console.error('Error parsing or validating the initial schedule:', error);
    if (error instanceof z.ZodError) {
      console.error('Validation errors:', error.errors);
    } else if (error instanceof SyntaxError) {
      console.error('JSON parsing error:', error.message);
    }
    // Return an empty array instead of throwing an error
    return [];
  }
}
async function extendScheduleItem(item: ScheduleItem): Promise<DetailedScheduleItem> {
  console.log(`Fetching details for task: ${item.title}`);
  let relevantData;
  try {
    relevantData = await retrieveEmbeddings(item.title, 5);
    console.log('Relevant data retrieved:', relevantData);
  } catch (error) {
    console.error('Error retrieving embeddings:', error);
    throw new Error('Failed to retrieve relevant data for task');
  }

  const prompt = ChatPromptTemplate.fromTemplate(`
    Based on the following data: {relevantDataString}

    Provide a detailed description for the task: {item.title}
    Include the following:
    1. Detailed description
    2. Steps to complete the task
    3. Background information
    4. Potential challenges

    Return your response as a JSON object with the following structure:
    {{
      "description": "string",
      "steps": "string",
      "background": "string",
      "challenges": "string"
  }}

    IMPORTANT! Your response must be ONLY a valid JSON object. Do not include any additional text before or after. Do not use markdown code block delimiters.
  `);

  console.log(`Generating detailed task description for: ${item.title}`);
  const chain = prompt.pipe(model).pipe(new StringOutputParser());
  
  let result;
  try {
    result = await chain.invoke({
      relevantDataString: stringify(relevantData),
      'item.title': item.title
    });
  } catch (invokeError) {
    console.error('Error invoking AI chain:', invokeError);
    throw new Error('Failed to generate task description');
  }

  console.log('Raw AI response:', result);

  if (!result || result.trim() === '') {
    console.error('AI returned empty or undefined result');
    throw new Error('Invalid AI response');
  }

  let parsedResult;
  try {
    // TODO: Fix this
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    parsedResult = JSON.parse(result);
    console.log('Parsed result:', parsedResult);
  } catch (parseError) {
    console.error('Error parsing AI response:', parseError);
    throw new Error('Failed to parse AI response');
  }

  const detailsSchema = z.object({
    description: z.string(),
    steps: z.string(),
    background: z.string(),
    challenges: z.string(),
  });

  let validatedDetails;
  try {
    validatedDetails = detailsSchema.parse(parsedResult);
  } catch (validationError) {
    console.error('Validation error:', validationError);
    throw new Error('AI response failed validation');
  }

  const detailedItem = {
    ...item,
    ...validatedDetails,
  };

  try {
    const validatedDetailedItem = DetailedScheduleItemSchema.parse(detailedItem);
    console.log('Validated detailed schedule item:', validatedDetailedItem);
    return validatedDetailedItem;
  } catch (finalValidationError) {
    console.error('Error in final validation:', finalValidationError);
    throw new Error('Failed to generate a valid detailed schedule item');
  }
}

async function refineSchedule(schedule: DetailedScheduleItem[]): Promise<DetailedScheduleItem[]> {
  const scheduleString = stringify(schedule);
  console.log('Refining schedule...');
  const prompt = ChatPromptTemplate.fromTemplate(`
    Review and refine the following schedule: {scheduleString}

    Consider the following:
    1. Task dependencies
    2. Potential conflicts
    3. Optimal task ordering

    Provide the refined schedule as a valid JSON array of objects, with each object having the following structure:
    {{
      "title": "string",
      "suggestedStartTime": "ISO 8601 date string",
      "suggestedEndTime": "ISO 8601 date string",
      "priority": number,
      "description": "string",
      "steps": "string",
      "background": "string",
      "challenges": "string"
    }}

    IMPORTANT! Your response must be ONLY the JSON array, with no additional text before or after. Only return the JSON array, but do not include any markdown code block delimiters. Simply output the raw JSON object
  `);

  const chain = prompt.pipe(model).pipe(new StringOutputParser());
  console.log('Chain initialized');
  const result = await chain.invoke({ scheduleString });
  console.log('Refinement result:', result);

  try {
    // Extract the JSON array from the result
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON array found in the result');
    }
    const jsonString = jsonMatch[0];
    
    // TODO: Fix this
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const parsedResult = JSON.parse(jsonString);
    const validatedSchedule = ScheduleSchema.parse(parsedResult);
    
    console.log('Validated refined schedule:', validatedSchedule);
    return validatedSchedule;
  } catch (error) {
    console.error('Error parsing or validating the refined schedule:', error);
    // Return the original schedule instead of throwing an error
    return schedule;
  }
}

async function storeSchedule(ctx: ProtectedTRPCContext, schedule: DetailedScheduleItem[]): Promise<void> {
  console.log('Storing schedule in the database...');
  const validatedSchedule = z.array(DetailedScheduleItemSchema).parse(schedule);
  
  for (const item of validatedSchedule) {
    console.log('Storing item:', item);
    await ctx.db.insert(aiSuggestedEvents).values({
      id: crypto.randomUUID().slice(0, 30),
      userId: ctx.user.id,
      title: item.title,
      description: item.description,
      suggestedStartTime: item.suggestedStartTime,
      suggestedEndTime: item.suggestedEndTime,
      priority: item.priority,
      steps: item.steps,
      background: item.background,
      challenges: item.challenges,
      status: 'pending',
    });
    console.log('Item stored:', item.title);
  }
  console.log('Schedule successfully stored.');
}

export async function generateWorkSchedule(ctx: ProtectedTRPCContext): Promise<void> {
  console.log('Starting schedule generation process...');
  try {
    const initialSchedule = await generateInitialSchedule();
    if (initialSchedule.length === 0) {
      throw new Error('Failed to generate initial schedule');
    }
    const detailedSchedule = await Promise.all(initialSchedule.map(extendScheduleItem));
    const refinedSchedule = await refineSchedule(detailedSchedule);
    await storeSchedule(ctx, refinedSchedule);
    console.log('Work schedule generation and storage process completed.');
  } catch (error) {
    console.error('Error in generateWorkSchedule:', error);
    throw new Error('Failed to generate work schedule');
  }
}

export async function myEvents(ctx: ProtectedTRPCContext) {
  console.log('Retrieving user events...');
  const events = await ctx.db.query.aiSuggestedEvents.findMany({
    where: eq(aiSuggestedEvents.userId, ctx.user.id),
    orderBy: (table, { desc }) => [desc(table.suggestedStartTime)],
  });
  console.log('Events retrieved:', events);
  return events;
}