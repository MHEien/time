import { useState } from 'react'
import { motion } from 'framer-motion'
import { BackgroundGradient } from '@/components/ui/background-gradient'
import { ButtonsCard } from './buttons-card'
import { Input } from '@/components/ui/input'

export const WakatimeForm = ({ onClose }: { onClose: () => void }) => {
  const [endpoint, setEndpoint] = useState('')
  const [apiKey, setApiKey] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Submitted:', { endpoint, apiKey })
    // Handle form submission logic here
    onClose()
  }

  return (
    <BackgroundGradient className="rounded-[22px] p-4 sm:p-10 bg-white dark:bg-zinc-900">
      <form onSubmit={handleSubmit} className="space-y-6">
        <h3 className="text-2xl font-bold text-center">Connect Wakatime</h3>
        <Input
          type="text"
          placeholder="Wakatime Endpoint"
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="API Key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          required
        />
        <div className="flex justify-end space-x-4">
          <ButtonsCard buttonText="Cancel" onClick={onClose} variant="secondary" />
          <ButtonsCard buttonText="Connect" type="submit" />
        </div>
      </form>
    </BackgroundGradient>
  )
}