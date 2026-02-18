'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock } from 'lucide-react'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (pin: string) => Promise<boolean>
}

export function PinDialog({ open, onOpenChange, onSubmit }: Props) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!pin) {
      setError('Enter the edit PIN')
      return
    }
    const success = await onSubmit(pin)
    if (!success) {
      setError('Incorrect PIN')
      setPin('')
    } else {
      setPin('')
      setError('')
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <DialogTitle className="text-center">Enter Edit PIN</DialogTitle>
          <DialogDescription className="text-center">
            Enter the PIN to make changes to this race.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pin" className="sr-only">PIN</Label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, '').slice(0, 6))
                setError('')
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="bg-secondary text-center font-mono text-lg tracking-widest"
              autoFocus
            />
            {error && <p className="text-center text-sm text-destructive">{error}</p>}
          </div>
          <Button onClick={handleSubmit} className="w-full">Unlock</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
