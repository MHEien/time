'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { HoverEffect } from '@/components/ui/card-hover-effect'
import { BackgroundGradient } from '@/components/ui/background-gradient'
import { TextGenerateEffect } from '@/components/ui/text-generate-effect'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import type { RouterOutputs } from '@/trpc/shared'

type User = RouterOutputs['user']['get']


export function Account({ initialUser }: { initialUser: User }) {
  const [isEditing, setIsEditing] = useState(false)
  const [user, setUser] = useState(initialUser)

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = () => {
    // Implement save logic here
    setIsEditing(false)
  }

  const handleCancel = () => {
    setUser(initialUser)
    setIsEditing(false)
  }

  return (
    <BackgroundGradient className="min-h-screen p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <TextGenerateEffect words="Account Settings" className="text-4xl font-bold mb-8 text-center" />
        
        <HoverEffect items={[
          {
            title: "Profile",
            description: "Manage your personal information",
            onClick: () => console.log("Profile clicked"),
          },
          {
            title: "Subscription",
            description: "View and manage your subscription details",
            onClick: () => console.log("Subscription clicked"),
          }
        ]} />

        <Tabs defaultValue="profile" className="mt-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="mt-4">
            <BackgroundGradient className="p-6 rounded-lg">
              <div className="flex items-center space-x-4 mb-4">
                <Avatar className="w-16 h-16">
                    <AvatarImage src={user?.avatar ?? "https://avatar.iran.liara.run/public"} alt="User Avatar" />
                    <AvatarFallback>UI</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-semibold">{user?.email}</h2>
                  <p className="text-sm text-gray-500">Member since {user.createdAt.toLocaleDateString()}</p>
                </div>
              </div>
              <div className="space-y-4">
                <Label htmlFor="email">Email</Label>
                <Input
                  value={user.email}
                  onChange={(e) => setUser({ ...user, email: e.target.value })}
                  disabled={!isEditing}
                />
                {/* Add more profile fields here */}
              </div>
            </BackgroundGradient>
          </TabsContent>
        </Tabs>

        <div className="mt-8 flex justify-end space-x-4">
          {isEditing ? (
            <>
              <Button onClick={handleSave}>Save Changes</Button>
              <Button onClick={handleCancel} variant="outline">Cancel</Button>
            </>
          ) : (
            <Button onClick={handleEdit}>Edit Profile</Button>
          )}
        </div>
      </motion.div>
    </BackgroundGradient>
  )
}