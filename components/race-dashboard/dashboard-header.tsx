'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Share2, Lock, Unlock, Timer, Flag, Edit } from 'lucide-react'
import type { Race, Leg } from '@/lib/types'
import { formatDuration, formatTime } from '@/lib/pace'
import { getTotalDistance, getCompletedDistance } from '@/lib/estimates'
import type { LegEstimate } from '@/lib/estimates'

type Props = {
  race: Race
  legs: Leg[]
  estimates: LegEstimate[]
  isUnlocked: boolean
  onShareClick: () => void
  onPinClick: () => void
  onEditClick?: () => void
}

export function DashboardHeader({ race, legs, estimates, isUnlocked, onShareClick, onPinClick }: Props) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (race.status !== 'active' || !race.start_time) return
    const start = new Date(race.start_time).getTime()
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000))
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [race.status, race.start_time])

  const total = getTotalDistance(legs)
  const completed = getCompletedDistance(legs)
  const progress = total > 0 ? (completed / total) * 100 : 0
  const completedLegs = legs.filter(l => l.status === 'completed').length

  const estimatedFinish = estimates.length > 0 ? estimates[estimates.length - 1].estimatedEnd : null

  // When race is finished, compute final elapsed from race.start_time to last leg end_time
  let finalElapsed: number | null = null
  if (race.status === 'finished' && race.start_time) {
    const endTimes = legs
      .map(l => l.end_time)
      .filter(Boolean)
      .map(t => new Date(t as string).getTime())

    if (endTimes.length > 0) {
      const last = Math.max(...endTimes)
      finalElapsed = Math.floor((last - new Date(race.start_time).getTime()) / 1000)
    }
  }
  return (
    <div className="flex flex-col gap-4">
      {/* Top row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Timer className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">{race.name}</h1>
            <Badge
              variant="outline"
              className={`text-xs mt-0.5 ${
                race.status === 'active'
                  ? 'bg-success/10 text-success border-success/30'
                  : race.status === 'finished'
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'bg-secondary text-muted-foreground'
              }`}
            >
              {race.status === 'active' ? 'LIVE' : race.status === 'finished' ? 'FINISHED' : 'SETUP'}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {race.status === 'setup' && onEditClick && (
            <Button variant="ghost" size="sm" onClick={onEditClick} className="gap-1.5">
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onShareClick} className="gap-1.5">
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>
          <Button
            variant={isUnlocked ? 'default' : 'outline'}
            size="sm"
            onClick={onPinClick}
            className="gap-1.5"
          >
            {isUnlocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            <span className="hidden sm:inline">{isUnlocked ? 'Unlocked' : 'Unlock'}</span>
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">Elapsed</p>
          <p className="font-mono text-lg font-bold">
            {race.status === 'active'
              ? formatDuration(elapsed)
              : finalElapsed != null
              ? formatDuration(finalElapsed)
              : '--:--:--'
            }
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">Distance</p>
          <p className="font-mono text-lg font-bold">
            {completed.toFixed(1)} <span className="text-xs text-muted-foreground font-normal">/ {total.toFixed(1)} mi</span>
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">Legs</p>
          <p className="font-mono text-lg font-bold">
            {completedLegs} <span className="text-xs text-muted-foreground font-normal">/ {legs.length}</span>
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Flag className="h-3 w-3" /> Est. Finish
          </p>
          <p className="font-mono text-lg font-bold">
            {estimatedFinish ? formatTime(estimatedFinish) : '--:--'}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex flex-col gap-1.5">
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground text-right">{progress.toFixed(1)}% complete</p>
      </div>
    </div>
  )
}
