'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BackgroundGradient } from '@/components/ui/background-gradient'
import { HoverEffect } from '@/components/ui/card-hover-effect'
import { StickyScroll } from '@/components/ui/sticky-scroll-reveal'
import { TextGenerateEffect } from '@/components/ui/text-generate-effect'
import { Button } from '@/components/ui/moving-border'
import { CustomTabs as Tabs } from '@/components/custom-tabs'
import type { RouterOutputs } from '@/trpc/shared'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { api } from '@/trpc/react'

type Commit = RouterOutputs['github']['myCommits'][number]
type Issue = RouterOutputs['github']['myIssues'][number]
type PullRequest = RouterOutputs['github']['myPRs'][number]

type GitHubData = {
  issues: Issue[]
  prs: PullRequest[]
  commits: Commit[]
}


const DataCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <BackgroundGradient className="rounded-[22px] p-4 sm:p-10 bg-white dark:bg-zinc-900">
    <h3 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200 mb-4">{title}</h3>
    {children}
  </BackgroundGradient>
)

const DataItem = ({ item, type }: { item: Issue | PullRequest | Commit; type: keyof GitHubData }) => (
  <motion.div
    className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-4 mb-2"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <h4 className="font-semibold text-neutral-800 dark:text-neutral-200">
      {type === 'commits' ? (item as Commit).message : (item as Issue | PullRequest).title}
    </h4>
    <p className="text-sm text-neutral-600 dark:text-neutral-400">
      {type === 'commits' 
        ? `SHA: ${(item as Commit).sha.substring(0, 7)}` 
        : `Status: ${(item as Issue | PullRequest).status}`}
    </p>
    <p className="text-sm text-neutral-600 dark:text-neutral-400">
      Created: {format(item.createdAt, 'yyyy-MM-dd')}
    </p>
    <p className="text-sm text-neutral-600 dark:text-neutral-400">
      Project ID: {item.projectId ?? 'N/A'}
    </p>
    <a href={item.githubUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline">
      View on GitHub
    </a>
  </motion.div>
)

export default function GitHubDataManager({ initialData }: { initialData: GitHubData }) {
  const [activeTab, setActiveTab] = useState<keyof GitHubData>('issues')
  const [isQuerying, setIsQuerying] = useState(false)

  const router = useRouter()

  const fetchGitHubData = api.github.fetchData.useMutation()

  const tabs = [
    { title: 'Issues', value: 'issues' },
    { title: 'Pull Requests', value: 'prs' },
    { title: 'Commits', value: 'commits' },
  ]

  const content = [
    {
      title: 'Manage Your GitHub Data',
      description: 'View and manage your GitHub issues, pull requests, and commits from the last 3 weeks across all your repositories.',
    },
    {
      title: 'Sync and Update',
      description: 'Keep your local database in sync with your GitHub repositories. Manage your workflow efficiently with real-time updates.',
    },
    {
      title: 'Comprehensive Overview',
      description: "Get a bird's eye view of your GitHub activity. Track progress, identify bottlenecks, and streamline your development process.",
    },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 py-10 px-4 sm:px-6 lg:px-8">
      <TextGenerateEffect words="GitHub Data Manager" className="text-4xl font-bold text-center mb-10" />
      
      <div className="max-w-7xl mx-auto mt-10 flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/2">
          <StickyScroll content={content} />
        </div>
        
        <div className="lg:w-1/2">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            setActiveTab={(tab) => setActiveTab(tab as keyof GitHubData)}
          />

          <DataCard title={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}>
            {initialData[activeTab].map((item) => (
              <DataItem key={item.id} item={item} type={activeTab} />
            ))}
          </DataCard>

          <div className="mt-8">
            <HoverEffect
              items={[
                {
                  title: 'Sync Data',
                  description: 'Update your local database with the latest GitHub data',
                  onClick: () => {
                    fetchGitHubData.mutateAsync({})
                      .then(() => {
                        router.refresh();
                      })
                      .catch((error) => {
                        console.error('Error fetching GitHub data:', error);
                      });
                  },
                },
                {
                  title: 'Manage Settings',
                  description: 'Configure your GitHub integration settings',
                  onClick: () => router.push('/dashboard/github/settings'),
                },
              ]}
            />
          </div>

          <div className="mt-8 text-center">
            <Button
              borderRadius="1.75rem"
              className="bg-white dark:bg-black text-black dark:text-white border-neutral-200 dark:border-slate-800"
            >
              Refresh Data
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}