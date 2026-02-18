'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import type { Leg, Runner } from '@/lib/types'
import { FATIGUE_LABELS } from '@/lib/types'
import { formatPace, formatDuration, suggestFatigue } from '@/lib/pace'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  leg: Leg | null
  runner: Runner | null
  runnerLegIndex: number  // which of the runner's 3 legs this is (0, 1, 2)
  onComplete: (fatigueLevel: number) => void
  saving: boolean
}

export function CompleteLegDialog({ open, onOpenChange, leg, runner, runnerLegIndex, onComplete, saving }: Props) {
  const suggested = suggestFatigue(runnerLegIndex, new Date())
  const [fatigue, setFatigue] = useState(suggested)

  useEffect(() => {
    setFatigue(suggested)
  }, [suggested, open])

  if (!leg || !runner) return null

  const elapsed = leg.start_time
    ? (Date.now() - new Date(leg.start_time).getTime()) / 1000
    : 0
  const pace = elapsed > 0 ? (elapsed / 60) / leg.distance : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Leg {leg.leg_number}</DialogTitle>
          <DialogDescription>
            {runner.name} - {leg.distance} mi
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-5">
          {/* Elapsed time and pace */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-secondary p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Elapsed Time</p>
              <p className="font-mono text-xl font-bold">{formatDuration(elapsed)}</p>
            </div>
            <div className="rounded-lg bg-secondary p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Pace</p>
              <p className="font-mono text-xl font-bold">{pace > 0 ? `${formatPace(pace)}/mi` : '--'}</p>
            </div>
          </div>

          {/* Fatigue slider */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label>How does {runner.name.split(' ')[0]} feel?</Label>
              <span className="text-sm font-medium text-primary">
                {fatigue} - {FATIGUE_LABELS[fatigue]}
              </span>
            </div>
            <Slider
              value={[fatigue]}
              onValueChange={([val]) => setFatigue(val)}
              min={1}
              max={5}
              step={1}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Fresh</span>
              <span>Exhausted</span>
            </div>
            <p className="text-xs text-muted-foreground">
              System suggests: {suggested} ({FATIGUE_LABELS[suggested]}). Adjust based on how the runner actually feels.
            </p>
          </div>

          <Button
            onClick={() => onComplete(fatigue)}
            disabled={saving}
            className="w-full"
          >
            {saving ? 'Saving...' : `Complete Leg ${leg.leg_number}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
