'use client'

import { useState, useTransition, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { BackgroundGradient } from '@/components/ui/background-gradient'
import { ButtonsCard } from '../../settings/_components/buttons-card'
import { TextGenerateEffect } from '@/components/ui/text-generate-effect'
import { Input } from '@/components/ui/input'
import { toast } from "sonner"
import { api } from '@/trpc/react'
import type { RouterOutputs } from '@/trpc/shared'

type ApiKey = RouterOutputs['apiKey']['myApiKeys'][number]

const ApiKeyList = ({ initialKeys } : { initialKeys: ApiKey[] }) => {

  if (!initialKeys) return (
    <div className="space-y-4">
      <div className="flex items-center justify-center">
        <div className="animate-pulse rounded-lg bg-gray-800 h-12 w-40" />
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {initialKeys?.map((key) => (
        <div key={key.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
          <div>
            <h3 className="text-lg font-semibold">{key.name}</h3>
            <p className="text-sm text-gray-400">{key.id}</p>
          </div>
          <ButtonsCard
            buttonText="Revoke"
            onClick={() => console.log(`Revoke key ${key.id}`)}
            variant="secondary"
          />
        </div>
      ))}
    </div>
  )
}

const CreateApiKeyForm = () => {
  const [name, setName] = useState('')
  const router = useRouter()
  const [, startCreateTransaction] = useTransition()

  const apiKey = api.apiKey.create.useMutation()

  const createApiKey = (e: React.FormEvent) => {
    e.preventDefault()
    startCreateTransaction(async () => {
      await apiKey.mutateAsync(
        { name },
        {
          onSuccess: () => {
            toast.success("API Key created")
            router.refresh()
            setName('')
          },
          onError: () => {
            toast.error("Failed to create API key")
          },
        }
      )
    })
  }

  return (
    <form onSubmit={createApiKey} className="space-y-4">
      <Input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter a name for your API key"
        required
      />
      <ButtonsCard buttonText="Create API Key" type="submit" />
    </form>
  )
}

export function ApiKeys({ initialKeys } : { initialKeys: ApiKey[] }) {
  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <TextGenerateEffect words="API Key Management" className="text-4xl font-bold text-center mb-8" />
        <p className="text-gray-400 text-center mb-12">
          Manage your existing API keys and create new ones for your applications.
        </p>

        <div className="grid gap-8 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <BackgroundGradient className="rounded-[22px] p-4 sm:p-10 bg-white dark:bg-zinc-900">
              <h2 className="text-2xl font-bold mb-4">Your API Keys</h2>
              <Suspense fallback={<div className="text-center">Loading API keys...</div>}>
                <ApiKeyList initialKeys={initialKeys} />
              </Suspense>
            </BackgroundGradient>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <BackgroundGradient className="rounded-[22px] p-4 sm:p-10 bg-white dark:bg-zinc-900">
              <h2 className="text-2xl font-bold mb-4">Create New API Key</h2>
              <CreateApiKeyForm />
            </BackgroundGradient>
          </motion.div>
        </div>
      </div>
    </div>
  )
}