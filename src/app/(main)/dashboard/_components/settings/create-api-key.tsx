'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from '@/trpc/react'
import { toast } from "sonner";



export default function CreateApiKeyForm() {
  const [name, setName] = useState('')
  const router = useRouter()
  const [, startCreateTransaction] = useTransition();

    const apiKey = api.apiKey.create.useMutation();

    const createApiKey = () => {
        startCreateTransaction(async () => {
            await apiKey.mutateAsync(
                {
                    name: name,
                },
                {
                    onSuccess: () => {
                        toast.success("API Key created");
                        router.refresh()
                    },
                    onError: () => {
                        toast.error("Failed to create API key");
                    },
                },
              );
            });
          }; 


  return (
    <form onSubmit={createApiKey} className="space-y-4">
      <div>
        <Label htmlFor="keyName">API Key Name</Label>
        <Input
          id="keyName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter a name for your API key"
          required
        />
      </div>
      <Button type="submit">Create API Key</Button>
    </form>
  )
}