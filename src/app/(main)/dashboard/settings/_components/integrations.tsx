'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { GitHubLogoIcon as GithubIcon, DiscordLogoIcon as DiscordIcon } from '@radix-ui/react-icons'
import { WakatimeIcon, MicrosoftIcon } from './icons'
import { BackgroundGradient } from '@/components/ui/background-gradient'
import { ButtonsCard } from './buttons-card'
import { TextGenerateEffect } from '@/components/ui/text-generate-effect'
import { WakatimeForm } from './wakatime-form'

const integrations = [
  {
    name: 'GitHub',
    icon: <GithubIcon className="h-8 w-8" />,
    connected: true,
  },
  {
    name: 'Microsoft 365',
    icon: <MicrosoftIcon className="h-8 w-8" />,
    connected: false,
  },
  {
    name: 'Discord',
    icon: <DiscordIcon className="h-8 w-8" />,
    connected: false,
  },
  {
    name: 'Wakatime',
    icon: <WakatimeIcon className="h-8 w-8" />,
    connected: false,
    customForm: true,
  },
]

export default function IntegrationsComponent() {
  const [showWakatimeForm, setShowWakatimeForm] = useState(false)

  return (

      <div className="max-w-7xl mx-auto">
        <TextGenerateEffect words="Integrations" className="text-4xl font-bold text-center mb-8" />
        <p className="text-gray-400 text-center mb-12">
          Connect your account with other services to enhance your experience.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {integrations.map((integration) => (
            <motion.div
              key={integration.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <BackgroundGradient className="rounded-[22px] p-4 sm:p-10 bg-white dark:bg-zinc-900">
                <div className="flex flex-col items-center space-y-4">
                  {integration.icon}
                  <h3 className="text-2xl font-bold">{integration.name}</h3>
                  {integration.customForm ? (
                    <ButtonsCard
                      buttonText={showWakatimeForm ? 'Close Form' : 'Add API Key'}
                      onClick={() => setShowWakatimeForm(!showWakatimeForm)}
                    />
                  ) : (
                    <ButtonsCard
                      buttonText={integration.connected ? 'Disconnect' : 'Connect'}
                      onClick={() => console.log(`${integration.name} clicked`)}
                    />
                  )}
                </div>
              </BackgroundGradient>
            </motion.div>
          ))}
        </div>

        {showWakatimeForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-12"
          >
            <WakatimeForm onClose={() => setShowWakatimeForm(false)} />
          </motion.div>
        )}
      </div>
  )
}