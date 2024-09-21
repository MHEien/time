"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { TextGenerateEffect } from "@/components/ui/text-generate-effect"
import { UserIcon, LogOutIcon } from "lucide-react"
import type { RouterOutputs } from "@/trpc/shared"
import { logout } from "@/lib/auth/actions"

type User = RouterOutputs["user"]["get"]

export function Header({ initialUser }: { initialUser: User }) {
  const [isOpen, setIsOpen] = useState(false)


  return (
    <header className="bg-zinc-800 border-b border-zinc-700 py-4 px-6">
      <div className="flex items-center justify-between">
        <TextGenerateEffect words="WorkflowAI Dashboard" className="text-2xl font-bold" />
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <motion.img
                    src={initialUser.avatar ?? "https://avatar.iran.liara.run/public"}
                    alt="User avatar"
                    className="rounded-full object-cover"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  />
                </Avatar>
              </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-zinc-800 border border-zinc-700">
            <DropdownMenuItem asChild>
              <Link href="/dashboard/account" className="flex items-center">
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Account</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-500" onClick={async () => await logout()}>
              <LogOutIcon className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}