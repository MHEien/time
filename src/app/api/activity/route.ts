import { api } from '@/trpc/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import type { RouterOutputs } from '@/trpc/shared';

type Activity = RouterOutputs['activity']['myActivities'][number];

export async function POST(req: NextRequest) {

    const apiKey = headers().get('x-api-key');

    const body = await req.json() as Activity;
    const { activityType, applicationName, windowTitle, startTime, endTime, duration, projectId } = body

  if (!apiKey || typeof apiKey !== 'string') {
    return NextResponse.json({ message: 'API Key is required' });
  }

  const create = await api.activity.createWithApiKey.mutate({
    activityType,
    applicationName: applicationName ?? '', 
    windowTitle: windowTitle ?? '',
    startTime: startTime.toISOString(),
    endTime: endTime?.toISOString(),
    duration: duration ?? '',
    projectId: projectId ?? '',
  });
  

  return NextResponse.json(create);
}