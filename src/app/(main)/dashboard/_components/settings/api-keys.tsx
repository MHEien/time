import { Suspense, useState } from 'react'
import ApiKeyList from './api-key-list'
import CreateApiKeyForm from './create-api-key'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { api } from "@/trpc/server";

export async function ApiKeys() {

  const page = 1
  const perPage = 10

  const apiKeys = await api.apiKey.list.query({ page, perPage })

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">API Key Management</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your API Keys</CardTitle>
            <CardDescription>Manage your existing API keys</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div>Loading API keys...</div>}>
              <ApiKeyList initialKeys={apiKeys} />
            </Suspense>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Create New API Key</CardTitle>
            <CardDescription>Generate a new API key for your application</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateApiKeyForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}