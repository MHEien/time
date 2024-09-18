import { Suspense } from 'react'
import { Skeleton } from "@/components/ui/skeleton"
import UserSettingsForm from './user-settings-form'
import { api } from '@/trpc/server'

export default async function SettingsPage() {


  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold mb-8">User Settings</h1>
      <Suspense fallback={<SettingsSkeleton />}>
        <UserSettingsFormWrapper />
      </Suspense>
    </div>
  )
}

async function UserSettingsFormWrapper() {
  const settings = await api.userSettings.mySettings.query({})

  return <UserSettingsForm initialSettings={settings} />
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-[250px]" />
      <Skeleton className="h-8 w-[200px]" />
      <Skeleton className="h-8 w-[200px]" />
      <Skeleton className="h-8 w-[300px]" />
      <Skeleton className="h-8 w-[300px]" />
      <Skeleton className="h-8 w-[200px]" />
      <Skeleton className="h-8 w-[200px]" />
    </div>
  )
}