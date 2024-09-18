import { api } from '@/trpc/server';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function POST(req: NextRequest) {

    const apiKey = headers().get('x-api-key');

    const body = await req.json();
    const { activityType, applicationName, windowTitle, startTime, endTime, duration, projectId } = body;

  if (!apiKey || typeof apiKey !== 'string') {
    return NextResponse.json({ message: 'API Key is required' });
  }

  const create = await api.activity.createWithApiKey.mutate({
    activityType,
    applicationName,
    windowTitle,
    startTime,
    endTime,
    duration,
    projectId,
  }
  );

  return NextResponse.json(create);
}