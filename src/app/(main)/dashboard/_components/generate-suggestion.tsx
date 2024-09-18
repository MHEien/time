"use client"
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { api } from '@/trpc/react'

export default function GenerateSuggestion() {

  const generateMutation = api.aiSuggestions.generateNextWeekEvents.useMutation();

  return (
    <Button onClick={async () => {
      await generateMutation.mutateAsync({})
    }} className="fixed bottom-6 right-6 rounded-full w-12 h-12 p-0" size="icon">
      <PlusCircle className="w-6 h-6 text-white" />
    </Button>
  );
}