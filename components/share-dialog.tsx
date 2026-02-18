'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  raceId: string
  editPin: string
}

export function ShareDialog({ open, onOpenChange, raceId, editPin }: Props) {
  const [copied, setCopied] = useState(false)
  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/race/${raceId}`
    : `/race/${raceId}`

  function copyLink() {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share This Race</DialogTitle>
          <DialogDescription>
            Send this link to your teammates so they can view and update the race dashboard.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Dashboard Link</Label>
            <div className="flex gap-2">
              <Input value={url} readOnly className="bg-secondary font-mono text-sm" />
              <Button variant="outline" size="icon" onClick={copyLink}>
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Edit PIN</Label>
            <p className="rounded-md bg-secondary px-3 py-2 font-mono text-lg tracking-widest">
              {editPin}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Share this PIN separately with people who need to log leg completions and update times. Anyone with just the link can view the dashboard.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
