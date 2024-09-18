'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RouterOutputs } from '@/trpc/shared';

interface ApiKeyListProps {
  initialKeys: RouterOutputs['apiKey']['list']
}

export default function ApiKeyList({ initialKeys }: ApiKeyListProps) {
  const [keys, setKeys] = useState(initialKeys)
  const router = useRouter()

  const apiKeyMutation = api.apiKey.delete.useMutation();

  const handleDelete = async (id: number) => {
    await apiKeyMutation(id)
    setKeys(keys.filter(key => key.id !== id))
    router.refresh()
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Key</TableHead>
          <TableHead>Expires At</TableHead>
          <TableHead>Last Used</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {keys.map((key) => (
          <TableRow key={key.id}>
            <TableCell>{key.name}</TableCell>
            <TableCell>{key.key.slice(0, 10)}...</TableCell>
            <TableCell>{key.expiresAt ? new Date(key.expiresAt).toLocaleDateString() : 'Never'}</TableCell>
            <TableCell>{key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}</TableCell>
            <TableCell>
              <Button variant="destructive" onClick={() => handleDelete(key.id)}>Delete</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}